import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { Button } from "../components/ui/button";
import { syncPendingReward } from "../components/rewards/RewardFlow"; // ✅ thêm import này

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
    } else {
      // ✅ Gọi hàm đồng bộ phần thưởng nếu có
      await syncPendingReward();

      // Điều hướng về trang profile
      navigate("/profile");
    }
  };

  return (
    <div className="flex justify-center mt-12 mb-16 px-4">
      <div className="w-full max-w-md border border-gray-200 bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6 text-center">Đăng nhập</h1>

        <form
          onSubmit={handleLogin}
          className="space-y-4 flex flex-col items-center"
        >
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

          <Button type="submit" className="w-4/5">
            Đăng nhập
          </Button>
        </form>

        <p className="text-sm mt-4 text-center">
          Chưa có tài khoản?{" "}
          <Link to="/register" className="text-blue-500 hover:underline">
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  );
}
