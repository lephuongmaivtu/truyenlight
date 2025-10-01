import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { Button } from "../components/ui/button";

export function RegisterPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setSuccessMsg("Đăng ký thành công! Hãy kiểm tra email để xác nhận.");
      setTimeout(() => navigate("/login"), 2000);
    }
  };

  return (
    <div className="flex justify-center mt-12 mb-16 px-4">
      <div className="w-full max-w-md border border-gray-200 bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6 text-center">Đăng ký</h1>

        <form onSubmit={handleRegister} className="space-y-4 flex flex-col items-center">
          <input
            type="email"
            placeholder="Email"
            className="w-4/5 p-2 border rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="w-4/5 p-2 border rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {errorMsg && <p className="text-red-500 text-sm">{errorMsg}</p>}
          {successMsg && <p className="text-green-500 text-sm">{successMsg}</p>}

          <Button type="submit" className="w-4/5">
            Đăng ký
          </Button>
        </form>

        <p className="text-sm mt-4 text-center">
          Đã có tài khoản?{" "}
          <Link to="/login" className="text-blue-500 hover:underline">
            Đăng nhập ngay
          </Link>
        </p>
      </div>
    </div>
  );
}
