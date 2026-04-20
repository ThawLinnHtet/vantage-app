import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { auth } from '../services/api';
import { useAppStore } from '../stores/appStore';

const VantageLogo = ({ size = 40 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="18" fill="#5b76fe"/>
    <path d="M26 14L16 20L12 18V16L16 18L10 26H12L16 22L20 28V18L26 14Z" fill="white"/>
    <circle cx="8" cy="8" r="3" fill="#5b76fe" stroke="white" strokeWidth="1"/>
  </svg>
);

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  general?: string;
}

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

function SignupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const setUser = useAppStore((state) => state.setUser);

  // Redirect after successful signup
  useEffect(() => {
    const pendingCode = localStorage.getItem('pendingInviteCode');
    
    if (signupSuccess) {
      if (pendingCode) {
        // Has pending invite code - navigate to join page
        localStorage.removeItem('pendingInviteCode');
        navigate(`/join/${pendingCode}`, { replace: true });
      } else {
        const redirect = searchParams.get('redirect');
        if (redirect) {
          navigate(redirect, { replace: true });
        } else {
          navigate('/trips', { replace: true });
        }
      }
      setSignupSuccess(false);
    }
  }, [signupSuccess, searchParams, navigate]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    if (!validate()) return;
    
    setIsLoading(true);
    try {
      const { user } = await auth.register(formData.email, formData.password, formData.name);
      setUser(user);
      setSignupSuccess(true);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Registration failed';
      if (message.includes('Email')) {
        setErrors({ email: message });
      } else {
        setErrors({ general: message });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    const fieldName = e.target.name as keyof FormErrors;
    if (errors[fieldName]) {
      setErrors({ ...errors, [fieldName]: undefined });
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between px-4 md:px-6 lg:px-8 py-4 border-b" 
        style={{ borderColor: 'var(--color-ring)' }}
      >
        <Link to="/" className="flex items-center gap-2">
          <VantageLogo size={28} />
          <span className="text-lg font-display" style={{ color: 'var(--color-primary)' }}>Vantage</span>
        </Link>
      </motion.header>

      <main className="flex-1 flex items-center justify-center px-4 md:px-6 py-10 md:py-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="w-full max-w-sm md:max-w-md"
        >
          <h2 className="text-xl md:text-2xl font-display mb-2 text-center" style={{ color: 'var(--color-primary)', letterSpacing: '-0.72px' }}>
            Create your account
          </h2>
          <p className="text-body-standard text-sm md:text-base mb-6 text-center" style={{ color: '#555a6a' }}>
            Start planning trips with your group
          </p>
          
          {errors.general && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="error-field mb-4"
            >
              {errors.general}
            </motion.div>
          )}
          
          <motion.form 
            onSubmit={handleSubmit} 
            className="auth-card p-5 md:p-8"
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div 
              className="mb-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <label className="block text-caption mb-2" style={{ color: '#555a6a' }}>Name</label>
              <motion.input
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                type="text"
                className="input-field"
                placeholder="Your name"
                style={errors.name ? { borderColor: '#c53030' } : {}}
                whileFocus={{ scale: 1.02, boxShadow: '0 0 0 2px var(--color-interactive)' }}
                transition={{ duration: 0.2 }}
              />
              {errors.name && <p className="text-small mt-1" style={{ color: '#c53030' }}>{errors.name}</p>}
            </motion.div>
            <motion.div 
              className="mb-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
            >
              <label className="block text-caption mb-2" style={{ color: '#555a6a' }}>Email</label>
              <motion.input
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                type="email"
                className="input-field"
                placeholder="you@example.com"
                style={errors.email ? { borderColor: '#c53030' } : {}}
                whileFocus={{ scale: 1.02, boxShadow: '0 0 0 2px var(--color-interactive)' }}
                transition={{ duration: 0.2 }}
              />
              {errors.email && <p className="text-small mt-1" style={{ color: '#c53030' }}>{errors.email}</p>}
            </motion.div>
            <motion.div 
              className="mb-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <label className="block text-caption mb-2" style={{ color: '#555a6a' }}>Password</label>
              <motion.input
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                type="password"
                className="input-field"
                placeholder="••••••••"
                style={errors.password ? { borderColor: '#c53030' } : {}}
                whileFocus={{ scale: 1.02, boxShadow: '0 0 0 2px var(--color-interactive)' }}
                transition={{ duration: 0.2 }}
              />
              {errors.password && <p className="text-small mt-1" style={{ color: '#c53030' }}>{errors.password}</p>}
            </motion.div>
            <motion.button 
              type="submit" 
              disabled={isLoading}
              className="btn-primary w-full py-3 mt-2"
              style={{ 
                backgroundColor: 'var(--color-interactive)',
                borderRadius: '8px',
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: '16px'
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? 'Creating account...' : 'Create account'}
            </motion.button>
          </motion.form>
          
          <motion.p 
            className="text-caption text-center mt-6 text-sm" 
            style={{ color: '#555a6a' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--color-interactive)', fontWeight: 600 }}>
              Sign in
            </Link>
          </motion.p>
        </motion.div>
      </main>
    </div>
  );
}

export default SignupPage;