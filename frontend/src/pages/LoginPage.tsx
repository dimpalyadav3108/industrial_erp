import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Factory,
  LoaderCircle,
  LockKeyhole,
  Mail,
} from "lucide-react";
import { login } from "../services/auth.service";

export function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate("/dashboard", { replace: true });
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : "Unable to sign in"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-brand">
        <div className="brand-mark">
          <Factory size={30} strokeWidth={2.2} />
        </div>

        <div className="brand-copy">
          <span className="brand-kicker">Industrial operations platform</span>
          <h1>Manufacturing intelligence, from enquiry to commissioning.</h1>
          <p>
            Control engineering, procurement, production, quality, projects,
            dispatch and service from one connected ERP.
          </p>
        </div>

        <div className="brand-status">
          <span className="status-dot" />
          PostgreSQL and ERP services operational
        </div>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <div className="mobile-brand">
            <Factory size={24} />
            <span>Industrial ERP</span>
          </div>

          <div className="login-heading">
            <span>Secure workspace</span>
            <h2>Welcome back</h2>
            <p>Sign in using your authorized employee account.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <label htmlFor="email">Work email</label>
            <div className="input-wrap">
              <Mail size={19} />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@company.com"
                autoComplete="email"
                required
              />
            </div>

            <label htmlFor="password">Password</label>
            <div className="input-wrap">
              <LockKeyhole size={19} />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
              <button
                className="password-toggle"
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>

            {error && <div className="login-error">{error}</div>}

            <button
              className="login-button"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle className="spin" size={19} />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in to ERP
                  <ArrowRight size={19} />
                </>
              )}
            </button>
          </form>

          <p className="security-note">
            Access is monitored and recorded for operational security.
          </p>
        </div>
      </section>
    </main>
  );
}