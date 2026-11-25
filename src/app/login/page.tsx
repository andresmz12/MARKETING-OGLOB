"use client";
import { useFormState } from "react-dom";
import { login } from "../actions";

export default function Login() {
  const [state, action] = useFormState(login, null);
  return (
    <>
    <div className="fixed inset-0 -z-10 bg-gradient-to-br from-indigo-100 via-white to-fuchsia-100" />
    <form action={action} className="card mx-auto mt-28 max-w-sm space-y-4 p-6 shadow-lg">
      <div className="text-center">
        <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-xl font-bold text-white">O</span>
        <h1 className="text-xl font-bold tracking-tight">Marketing OGLOB</h1>
        <p className="text-sm text-gray-500">Inicia sesión para continuar</p>
      </div>
      <div><label className="label">Correo</label><input name="email" type="email" required className="input" /></div>
      <div><label className="label">Contraseña</label><input name="password" type="password" required className="input" /></div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button className="btn w-full justify-center">Entrar</button>
    </form>
    </>
  );
}
