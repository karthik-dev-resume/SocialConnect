"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { User, Shield } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, login, register } = useAuth();
  const [loginType, setLoginType] = useState<"user" | "admin" | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    first_name: "",
    last_name: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Redirect if already logged in
  if (!loading && user) {
    if (user.role === "admin") {
      router.replace("/admin-dashboard");
    } else {
      router.replace("/feed");
    }
    return null;
  }

  const handleUserLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await login(emailOrUsername, password);
      toast.success("Logged in successfully!");
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to login";
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (emailOrUsername === "karthik.admin" && password === "test@123") {
        await login("karthik.admin", "test@123");
        toast.success("Admin login successful!");
      } else {
        toast.error("Invalid admin credentials");
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to login";
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await register(formData);
      toast.success("Account created successfully!");
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to register";
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Loading...</h1>
        </div>
      </div>
    );
  }

  // Show login type selection screen
  if (loginType === null) {
    return (
      <div className="min-h-screen flex">
        {/* Left Section - Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 relative overflow-hidden">
          {/* Geometric Pattern Background */}
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            ></div>
          </div>

          <div className="relative z-10 flex flex-col justify-between p-12 text-white">
            <div>
              {/* Logo placeholder */}
              <div className="mb-12">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                  <span className="text-blue-900 text-2xl font-bold">SC</span>
                </div>
              </div>

              <h1 className="text-5xl font-bold mb-4">Hello Socialians! 👋</h1>
              <p className="text-xl text-blue-100 leading-relaxed">
                Connect, share, and stay in the loop! Engage with friends, join
                conversations, and express yourself instantly!
              </p>
            </div>

            <div className="text-blue-200 text-sm">
              © {new Date().getFullYear()} Vega. All rights reserved.
            </div>
          </div>
        </div>

        {/* Right Section - Login Type Selection */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
          <div className="w-full max-w-md flex flex-col gap-6">
            <div>
              <h1 className="text-4xl font-bold mb-2 text-gray-900">
                Social Connect
              </h1>
              <h2 className="text-xl font-semibold mb-2 text-gray-800">
                Welcome to Vega
              </h2>
            </div>

            <div className="space-y-4">
              <Button
                onClick={() => setLoginType("user")}
                className="w-full h-12 text-lg bg-blue-900 hover:bg-gray-800 text-white"
              >
                <User className="mr-2 h-5 w-5" />
                Login as User
              </Button>
              <Button
                onClick={() => setLoginType("admin")}
                variant="outline"
                className="w-full h-12 text-lg border-gray-300 hover:bg-gray-50"
              >
                <Shield className="mr-2 h-5 w-5" />
                Login as Admin
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show login/register form based on selected type
  return (
    <div className="min-h-screen flex">
      {/* Left Section - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 relative overflow-hidden">
        {/* Geometric Pattern Background */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          ></div>
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div>
            {/* Logo placeholder */}
            <div className="mb-12">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                <span className="text-blue-900 text-2xl font-bold">SC</span>
              </div>
            </div>

            <h1 className="text-5xl font-bold mb-4">Hello Socialians! 👋</h1>
            <p className="text-xl text-blue-100 leading-relaxed">
              Connect, share, and stay in the loop! Engage with friends, join
              conversations, and express yourself instantly!
            </p>
          </div>

          <div className="text-blue-200 text-sm">
            © {new Date().getFullYear()} Vega. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right Section - Login/Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Brand Name */}
          <h1 className="text-4xl font-bold mb-2 text-gray-900">
            Social Connect
          </h1>

          {/* Welcome Message */}
          <h2 className="text-2xl font-semibold mb-6 text-gray-800">
            {isRegistering
              ? "Create an account"
              : loginType === "admin"
              ? "Admin Login"
              : "Welcome Back!"}
          </h2>

          {/* Sign Up/Login Toggle - Only for user login */}
          {loginType === "user" && !isRegistering && (
            <p className="text-gray-600 mb-8 text-sm">
              Don&rsquo;t have an account?{" "}
              <button
                type="button"
                onClick={() => setIsRegistering(true)}
                className="text-blue-600 hover:underline font-medium"
              >
                Create a new account now
              </button>
              , it&rsquo;s FREE! Takes less than a minute.
            </p>
          )}

          {loginType === "user" && isRegistering && (
            <p className="text-gray-600 mb-8 text-sm">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setIsRegistering(false)}
                className="text-blue-600 hover:underline font-medium"
              >
                Login here
              </button>
            </p>
          )}

          {/* Registration Form */}
          {isRegistering && loginType === "user" ? (
            <form onSubmit={handleRegister} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name" className="text-gray-700">
                    First Name
                  </Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    type="text"
                    placeholder="John"
                    value={formData.first_name}
                    onChange={handleChange}
                    required
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name" className="text-gray-700">
                    Last Name
                  </Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    type="text"
                    placeholder="Doe"
                    value={formData.last_name}
                    onChange={handleChange}
                    required
                    className="h-11"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username" className="text-gray-700">
                  Username
                </Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="johndoe"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  minLength={3}
                  maxLength={30}
                  pattern="[a-zA-Z0-9_]+"
                  className="h-11"
                />
                <p className="text-xs text-gray-500">
                  3-30 characters, letters, numbers, and underscores only
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg_password" className="text-gray-700">
                  Password
                </Label>
                <Input
                  id="reg_password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={8}
                  className="h-11"
                />
                <p className="text-xs text-gray-500">At least 8 characters</p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsRegistering(false);
                    setFormData({
                      email: "",
                      username: "",
                      password: "",
                      first_name: "",
                      last_name: "",
                    });
                  }}
                  className="flex-1 h-11"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-11 bg-gray-900 hover:bg-gray-800 text-white font-medium"
                  disabled={submitting}
                >
                  {submitting ? "Creating account..." : "Create account"}
                </Button>
              </div>
            </form>
          ) : (
            /* Login Form */
            <form
              onSubmit={
                loginType === "admin" ? handleAdminLogin : handleUserLogin
              }
              className="space-y-5"
            >
              <div className="space-y-2">
                <Label htmlFor="emailOrUsername" className="text-gray-700">
                  {loginType === "admin"
                    ? "Admin Username"
                    : "Email or Username"}
                </Label>
                <Input
                  id="emailOrUsername"
                  type="text"
                  placeholder={
                    loginType === "admin"
                      ? "karthik.admin"
                      : "Enter your email or username"
                  }
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setLoginType(null);
                    setEmailOrUsername("");
                    setPassword("");
                    setIsRegistering(false);
                  }}
                  className="flex-1 h-11"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-11 bg-gray-900 hover:bg-gray-800 text-white font-medium"
                  disabled={submitting}
                >
                  {submitting ? "Logging in..." : "Login Now"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
