"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Platform, Role } from "@prisma/client";
import { db } from "@/lib/db";
import { assertCompany, requireRole } from "@/lib/auth";
import { COOKIE, signSession } from "@/lib/session";
import { rollupPost } from "@/lib/rollup";

const s = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const PLATFORM_IDS: Platform[] = ["TIKTOK", "INSTAGRAM", "FACEBOOK", "LINKEDIN"];

// ---------- Sesión ----------
export async function login(_: unknown, f: FormData) {
  const user = await db.user.findUnique({ where: { email: s(f, "email").toLowerCase() } });
  if (!user || !user.active || !(await bcrypt.compare(s(f, "password"), user.passwordHash))) {
    return { error: "Correo o contraseña incorrectos" };
  }
  cookies().set(COOKIE, await signSession(user.id), {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 7,
  });
  redirect("/");
}

export async function logout() {
  cookies().delete(COOKIE);
  redirect("/login");
}

// ---------- Posts ----------
export async function savePost(f: FormData) {
  const user = await requireRole("EDITOR");
  const id = s(f, "id");
  const companyId = s(f, "companyId");
  assertCompany(user, companyId);

  const platforms = f.getAll("platforms").map(String).filter((p): p is Platform => PLATFORM_IDS.includes(p as Platform));
  if (platforms.length === 0) throw new Error("Elige al menos una plataforma");
  const scheduledRaw = s(f, "scheduledAt");
  const data = {
    companyId,
    campaignId: s(f, "campaignId") || null,
    title: s(f, "title") || "Sin título",
    caption: s(f, "caption"),
    mediaUrl: s(f, "mediaUrl"),
    mediaType: s(f, "mediaType") === "VIDEO" ? "VIDEO" : "IMAGE",
    scheduledAt: scheduledRaw ? new Date(scheduledRaw) : null,
  };

  let postId = id;
  if (id) {
    const existing = await db.post.findUniqueOrThrow({ where: { id } });
    assertCompany(user, existing.companyId);
    if (existing.status === "PUBLISHING" || existing.status === "PUBLISHED") throw new Error("Ya se publicó; no se puede editar");
    // Cualquier edición vuelve a borrador: hay que re-aprobar
    await db.post.update({ where: { id }, data: { ...data, status: "DRAFT" } });
    await db.postTarget.deleteMany({ where: { postId: id, platform: { notIn: platforms } } });
    await db.postTarget.updateMany({ where: { postId: id }, data: { status: "DRAFT" } });
  } else {
    postId = (await db.post.create({ data: { ...data, createdById: user.id } })).id;
  }
  for (const platform of platforms) {
    await db.postTarget.upsert({
      where: { postId_platform: { postId, platform } },
      update: {},
      create: { postId, platform },
    });
  }
  revalidatePath("/", "layout");
  redirect(`/posts/${postId}`);
}

export async function postAction(f: FormData) {
  const user = await requireRole("MANAGER");
  const id = s(f, "id");
  const action = s(f, "action"); // approve | schedule | unschedule | retry | delete
  const post = await db.post.findUniqueOrThrow({ where: { id } });
  assertCompany(user, post.companyId);

  if (action === "delete") {
    if (post.status === "PUBLISHING") throw new Error("Se está publicando ahora");
    await db.post.delete({ where: { id } });
    revalidatePath("/", "layout");
    redirect("/posts");
  }
  if (action === "approve") {
    await db.postTarget.updateMany({ where: { postId: id, status: "DRAFT" }, data: { status: "APPROVED" } });
  } else if (action === "schedule") {
    if (!post.scheduledAt) throw new Error("Pon una fecha y hora antes de programar");
    if (!post.mediaUrl && post.mediaType === "VIDEO") throw new Error("TikTok/Reels necesitan un video");
    await db.postTarget.updateMany({
      where: { postId: id, status: { in: ["DRAFT", "APPROVED", "FAILED"] } },
      data: { status: "SCHEDULED", attempts: 0, error: null },
    });
  } else if (action === "unschedule") {
    await db.postTarget.updateMany({ where: { postId: id, status: "SCHEDULED" }, data: { status: "APPROVED" } });
  } else if (action === "retry") {
    await db.postTarget.updateMany({ where: { postId: id, status: "FAILED" }, data: { status: "SCHEDULED", attempts: 0, error: null } });
  }
  await rollupPost(id);
  revalidatePath("/", "layout");
  redirect(`/posts/${id}`);
}

// ---------- Campañas ----------
export async function createCampaign(f: FormData) {
  const user = await requireRole("MANAGER");
  const companyId = s(f, "companyId");
  assertCompany(user, companyId);
  await db.campaign.create({
    data: {
      companyId,
      name: s(f, "name") || "Campaña",
      theme: s(f, "theme"),
      objective: s(f, "objective"),
      budget: s(f, "budget") ? s(f, "budget") : null,
      startDate: s(f, "startDate") ? new Date(s(f, "startDate")) : null,
      endDate: s(f, "endDate") ? new Date(s(f, "endDate")) : null,
    },
  });
  revalidatePath("/campaigns");
}

export async function setCampaignStatus(f: FormData) {
  const user = await requireRole("MANAGER");
  const c = await db.campaign.findUniqueOrThrow({ where: { id: s(f, "id") } });
  assertCompany(user, c.companyId);
  const status = z.enum(["PLANNED", "ACTIVE", "PAUSED", "DONE"]).parse(s(f, "status"));
  await db.campaign.update({ where: { id: c.id }, data: { status } });
  revalidatePath("/campaigns");
}

// ---------- Usuarios y empresas (solo ADMIN) ----------
const ROLES: Role[] = ["ADMIN", "MANAGER", "EDITOR", "VIEWER"];

export async function createUser(f: FormData) {
  await requireRole("ADMIN");
  const role = s(f, "role") as Role;
  if (!ROLES.includes(role)) throw new Error("Rol inválido");
  const password = s(f, "password");
  if (password.length < 8) throw new Error("La contraseña necesita al menos 8 caracteres");
  await db.user.create({
    data: {
      email: s(f, "email").toLowerCase(),
      name: s(f, "name"),
      role,
      passwordHash: await bcrypt.hash(password, 10),
      companies: { create: f.getAll("companies").map((companyId) => ({ companyId: String(companyId) })) },
    },
  });
  revalidatePath("/users");
}

export async function updateUser(f: FormData) {
  const admin = await requireRole("ADMIN");
  const id = s(f, "id");
  const role = s(f, "role") as Role;
  if (!ROLES.includes(role)) throw new Error("Rol inválido");
  const active = f.get("active") === "on";
  if (id === admin.id && (role !== "ADMIN" || !active)) throw new Error("No puedes quitarte tu propio acceso de admin");
  const password = s(f, "password");
  await db.user.update({
    where: { id },
    data: { role, active, ...(password.length >= 8 ? { passwordHash: await bcrypt.hash(password, 10) } : {}) },
  });
  await db.userCompany.deleteMany({ where: { userId: id } });
  const companies = f.getAll("companies").map(String);
  if (companies.length) await db.userCompany.createMany({ data: companies.map((companyId) => ({ userId: id, companyId })) });
  revalidatePath("/users");
}

export async function updateCompany(f: FormData) {
  await requireRole("ADMIN");
  await db.company.update({ where: { id: s(f, "id") }, data: { name: s(f, "name"), color: s(f, "color") || "#6366f1" } });
  revalidatePath("/", "layout");
}
