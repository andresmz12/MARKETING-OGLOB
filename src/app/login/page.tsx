"use client";
import { useFormState } from "react-dom";
import { login } from "../actions";

export default function Login() {
  const [state, action] = useFormState(login, null);
  return (
    <form action={action} className="card mx-auto mt-24 max-w-sm space-y-4">
      <h1 className="text-lg font-semibold">Marketing OGLOB</h1>
      <div><label className="label">Correo</label><input name="email" type="email" required className="input" /></div>
      <div><label className="label">Contraseña</label><input name="password" type="password" required className="input" /></div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button className="btn w-full justify-center">Entrar</button>
    </form>
  );
}
