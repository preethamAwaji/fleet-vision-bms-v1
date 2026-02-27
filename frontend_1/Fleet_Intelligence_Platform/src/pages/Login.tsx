import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/data/mockData';
import { Bolt, Eye, EyeOff, Battery, Zap } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

// Animated Battery Component
const AnimatedBattery = ({ level, delay }: { level: number; delay: number }) => (
  <div 
    className="absolute opacity-40 hover:opacity-70 transition-opacity duration-300"
    style={{
      animationDelay: `${delay}s`,
      animation: `float 6s ease-in-out infinite`,
      filter: 'drop-shadow(0 0 8px rgba(34, 197, 94, 0.6))'
    }}
  >
    <div className="relative">
      <Battery className="h-10 w-10 text-green-400" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div 
          className="bg-green-400 rounded-sm transition-all duration-1000 shadow-inner"
          style={{
            width: `${level}%`,
            height: '50%',
            animation: `pulse 2s ease-in-out infinite`,
            boxShadow: '0 0 10px rgba(34, 197, 94, 0.8), inset 0 0 5px rgba(34, 197, 94, 0.6)'
          }}
        />
      </div>
    </div>
  </div>
);

// Floating Charging Icons
const ChargingIcon = ({ delay }: { delay: number }) => (
  <div 
    className="absolute opacity-30 hover:opacity-50 transition-opacity duration-300"
    style={{
      animationDelay: `${delay}s`,
      animation: `float 8s ease-in-out infinite`,
      filter: 'drop-shadow(0 0 6px rgba(34, 197, 94, 0.7))'
    }}
  >
    <Zap className="h-8 w-8 text-green-300" />
  </div>
);

// Electric Particles
const ElectricParticle = ({ delay, size }: { delay: number; size: string }) => (
  <div 
    className={`absolute bg-green-400 rounded-full opacity-30 ${size}`}
    style={{
      animationDelay: `${delay}s`,
      animation: `float 10s linear infinite`,
      boxShadow: '0 0 8px rgba(34, 197, 94, 0.8)'
    }}
  />
);

const roles: { value: UserRole; label: string }[] = [
  { value: 'fleet_operator', label: 'Fleet Operator' },
  { value: 'maintenance_engineer', label: 'Maintenance Engineer' },
  { value: 'admin', label: 'Admin' },
];

const Login = () => {
  const [email, setEmail] = useState('admin@evolve.3x.com');
  const [password, setPassword] = useState('password');
  const [role, setRole] = useState<UserRole>('fleet_operator');
  const [showPw, setShowPw] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email, password, role);
    navigate('/dashboard');
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel with animated background */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 items-center justify-center p-12 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          {/* Floating Battery Icons */}
          <div className="absolute top-16 left-16">
            <AnimatedBattery level={85} delay={0} />
          </div>
          <div className="absolute top-20 right-20">
            <AnimatedBattery level={92} delay={1} />
          </div>
          <div className="absolute top-1/3 right-16">
            <AnimatedBattery level={78} delay={2} />
          </div>
          <div className="absolute bottom-1/3 left-20">
            <AnimatedBattery level={95} delay={3} />
          </div>
          <div className="absolute bottom-20 right-24">
            <AnimatedBattery level={67} delay={4} />
          </div>
          <div className="absolute top-1/2 left-12">
            <AnimatedBattery level={88} delay={5} />
          </div>
          <div className="absolute top-3/4 right-1/3">
            <AnimatedBattery level={72} delay={6} />
          </div>
          
          {/* Floating Charging Icons */}
          <div className="absolute top-32 right-32">
            <ChargingIcon delay={0.5} />
          </div>
          <div className="absolute top-2/3 left-24">
            <ChargingIcon delay={1.5} />
          </div>
          <div className="absolute bottom-40 right-12">
            <ChargingIcon delay={2.5} />
          </div>
          <div className="absolute bottom-1/2 left-8">
            <ChargingIcon delay={3.5} />
          </div>
          <div className="absolute top-40 left-1/3">
            <ChargingIcon delay={4.5} />
          </div>
          <div className="absolute bottom-1/4 right-1/2">
            <ChargingIcon delay={5.5} />
          </div>
          
          {/* Electric Particles */}
          <div className="absolute top-1/4 left-1/4">
            <ElectricParticle delay={0} size="w-2 h-2" />
          </div>
          <div className="absolute top-1/2 right-1/3">
            <ElectricParticle delay={2} size="w-1 h-1" />
          </div>
          <div className="absolute bottom-1/3 left-1/3">
            <ElectricParticle delay={4} size="w-3 h-3" />
          </div>
          <div className="absolute top-3/4 right-1/4">
            <ElectricParticle delay={6} size="w-1.5 h-1.5" />
          </div>
          <div className="absolute bottom-1/2 left-1/2">
            <ElectricParticle delay={8} size="w-2 h-2" />
          </div>
          
          {/* Electric Grid Pattern */}
          <div className="absolute inset-0 opacity-20">
            <svg width="100%" height="100%" className="absolute inset-0">
              <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#22c55e" strokeWidth="2"/>
                <circle cx="30" cy="30" r="2" fill="#22c55e" opacity="0.5"/>
              </pattern>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
          
          {/* Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-slate-800/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/30 via-transparent to-slate-900/30" />
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-slate-800/20 to-slate-900/40" />
        </div>
        
        <div className="max-w-md text-white relative z-10 animate-slideIn">
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center justify-center">
              <img 
                src="/ChatGPT_Image_Feb_24__2026__04_52_19_PM-removebg-preview.png" 
                alt="Fleet Vision Logo" 
                className="h-56 w-auto object-contain max-w-full"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = target.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/20 backdrop-blur-sm border border-green-400/30 animate-pulse" style={{ boxShadow: '0 0 20px rgba(34, 197, 94, 0.3)', display: 'none' }}>
                <Bolt className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </div>
          <h1 className="text-4xl font-bold leading-tight mb-4 animate-slideIn" style={{ animationDelay: '0.2s' }}>
            Intelligent Electric Vehicle Fleet Management
          </h1>
          <p className="text-lg text-gray-300 mb-12 animate-slideIn" style={{ animationDelay: '0.4s' }}>
            Monitor battery health, optimize charging, track vehicles in real-time, and keep your fleet running at peak efficiency.
          </p>
          <div className="grid grid-cols-3 gap-6 animate-slideIn" style={{ animationDelay: '0.6s' }}>
            {[
              { val: '99.2%', label: 'Uptime' },
              { val: '340+', label: 'Vehicles' },
              { val: '28%', label: 'Cost Savings' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-bold text-green-400">{s.val}</p>
                <p className="text-sm text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex items-center justify-center mb-4">
          <div className="flex items-center justify-center">
            <img 
              src="/ChatGPT_Image_Feb_24__2026__04_52_19_PM-removebg-preview.png" 
              alt="Fleet Vision Logo" 
              className="h-48 w-auto object-contain max-w-full"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallback = target.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary" style={{ display: 'none' }}>
              <Bolt className="h-5 w-5 text-primary-foreground" />
            </div>
          </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold">Welcome back</h2>
            <p className="mt-1 text-muted-foreground">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role selection */}
            <div className="space-y-2">
              <Label>Sign in as</Label>
              <div className="grid grid-cols-1 gap-2">
                {roles.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={cn(
                      'flex items-center justify-center rounded-lg border p-3 text-sm font-medium transition-all duration-200',
                      role === r.value
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm'
                        : 'border-border hover:border-primary/40 hover:bg-muted/30'
                    )}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input id="password" type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button type="submit" className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-default">
              Sign In
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
