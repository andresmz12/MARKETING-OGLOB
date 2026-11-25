"use client";
import { useFormState } from "react-dom";
import { changePassword } from "../actions";

export default function Account() {
  const [state, action] = useFormState(changePassword, null);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Mi cuenta</h1>
      <form action={action} className="card max-w-md space-y-4">
        <h2 className="font-medium">Cambiar contraseña</h2>
        <div><label className="label">Contraseña actual</label><input name="current" type="password" required className="input" /></div>
        <div><label className="label">Nueva contraseña (mín. 8)</label><input name="next" type="password" minLength={8} required className="input" /></div>
        <div><label className="label">Repite la nueva</label><input name="confirm" type="password" minLength={8} required className="input" /></div>
        {state && "error" in state && <p className="text-sm text-red-600">{state.error}</p>}
        {state && "ok" in state && <p className="text-sm text-green-600">{state.ok}</p>}
        <button className="btn">Guardar</button>
      </form>
    </div>
  );
}
