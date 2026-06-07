import { useState } from 'react';
import { ShieldCheck, User, Lock, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate network delay for premium feel
    setTimeout(() => {
      if (username === 'hstinfrastructures' && password === 'hstinfrastructures') {
        localStorage.setItem('isAuthenticated', 'true');
        onLogin();
      } else {
        toast.error('Authentication failed. Please verify credentials.');
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[var(--theme-bg-app)] flex items-center justify-center relative overflow-hidden selection:bg-[var(--theme-primary)] selection:text-white">
      
      {/* Abstract Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[50%] bg-[var(--theme-primary)] rounded-full blur-[120px] opacity-20 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[30%] h-[40%] bg-[var(--theme-accent)] rounded-full blur-[100px] opacity-20"></div>

      <div className="w-full max-w-5xl mx-4 flex glass-panel rounded-3xl overflow-hidden shadow-2xl relative z-10 border border-[var(--theme-border)]/50 min-h-[600px]">
        
        {/* Left Branding Side (Hidden on Mobile) */}
        <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 bg-gradient-to-br from-[var(--theme-bg-panel)] to-[var(--theme-bg-app)] border-r border-[var(--theme-border)] relative overflow-hidden">
          {/* Overlay Pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(var(--theme-text-main) 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
          
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--theme-primary)]/10 border border-[var(--theme-primary)]/20 text-[var(--theme-primary)] text-xs font-bold tracking-widest uppercase mb-8">
              <ShieldCheck size={14} /> System Secure
            </div>
            <h1 className="text-4xl font-black text-[var(--theme-text-main)] leading-tight tracking-tight">
              Enterprise Resource <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-accent)]">
                Planning Platform
              </span>
            </h1>
            <p className="mt-6 text-[var(--theme-text-muted)] text-base max-w-md leading-relaxed font-medium">
              Centralized intelligence for HST INFRASTRUCTURES. Manage inventory, process sales, generate dynamic estimates, and monitor financial pipelines seamlessly.
            </p>
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
                <img src="/logo.png" alt="HST Logo" className="h-6 w-6 object-contain" />
              </div>
              <div>
                <p className="text-[var(--theme-text-main)] font-bold text-sm">HST INFRASTRUCTURES</p>
                <p className="text-[var(--theme-text-muted)] text-[11px] font-semibold tracking-wider">EST. 2026</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Login Form Side */}
        <div className="w-full lg:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-[var(--theme-bg-nav)]/50 backdrop-blur-md">
          <div className="max-w-sm mx-auto w-full">
            <div className="text-center mb-10 lg:text-left">
              <h2 className="text-2xl font-bold text-[var(--theme-text-main)]">Access Portal</h2>
              <p className="text-[var(--theme-text-muted)] text-sm mt-2 font-medium">Enter your credentials to proceed</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-[var(--theme-text-muted)] uppercase tracking-wider mb-2">System ID</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User size={18} className="text-[var(--theme-text-muted)] group-focus-within:text-[var(--theme-primary)] transition-colors" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] rounded-xl pl-11 pr-4 py-3.5 text-[var(--theme-text-main)] text-sm font-medium focus:outline-none focus:border-[var(--theme-primary)] focus:ring-1 focus:ring-[var(--theme-primary)] transition-all"
                    placeholder="Enter system ID"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--theme-text-muted)] uppercase tracking-wider mb-2">Access Key</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock size={18} className="text-[var(--theme-text-muted)] group-focus-within:text-[var(--theme-primary)] transition-colors" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[var(--theme-bg-panel)] border border-[var(--theme-border)] rounded-xl pl-11 pr-4 py-3.5 text-[var(--theme-text-main)] text-sm font-medium focus:outline-none focus:border-[var(--theme-primary)] focus:ring-1 focus:ring-[var(--theme-primary)] transition-all"
                    placeholder="Enter access key"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-primary-hover)] text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg hover:shadow-[var(--shadow-glow)] hover:-translate-y-0.5 flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {isLoading ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Authenticate <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-10 text-center">
              <p className="text-[var(--theme-text-muted)] text-[10px] font-semibold uppercase tracking-widest">
                Protected by 256-bit AES Encryption
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
