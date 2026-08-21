import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Eye, EyeOff, Mail, KeyRound, ArrowLeft, ArrowRight } from 'lucide-react';
import logo from '../assets/ikigai.png';

export default function Login() {
  const [mode, setMode] = useState('password'); // 'password', 'otp'
  const [step, setStep] = useState('email'); // 'email', 'verify', 'optional-password'
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, sendOtp, verifyOtpLogin, updatePassword, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Only auto-navigate if user is loaded and we are not in the middle of setting an optional password
    if (user && step !== 'optional-password') {
      navigate('/');
    }
  }, [user, navigate, step]);

  const handleModeChange = (newMode) => {
    setMode(newMode);
    setStep('email');
    setError('');
    setSuccess('');
    setPassword('');
    setOtp('');
    setNewPassword('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      if (mode === 'password') {
        const result = await login(email, password);
        if (result.success) {
          navigate('/');
        } else {
          setError(result.message || 'Login failed. Please try again.');
        }
      } 
      else if (mode === 'otp') {
        if (step === 'email') {
          const result = await sendOtp(email);
          if (result.success) {
            setSuccess('OTP sent to your email! (Valid for 5 minutes)');
            setStep('verify');
          } else {
            setError(result.message || 'Failed to send OTP.');
          }
        } 
        else if (step === 'verify') {
          const result = await verifyOtpLogin(email, otp);
          if (result.success) {
            setSuccess('Login Successful!');
            setStep('optional-password');
          } else {
            setError(result.message || 'Invalid OTP.');
          }
        } 
        else if (step === 'optional-password') {
          if (newPassword.length > 0 && newPassword.length < 6) {
            setError('Password must be at least 6 characters.');
            setIsLoading(false);
            return;
          }
          const result = await updatePassword(newPassword);
          if (result.success) {
            navigate('/');
          } else {
            setError(result.message || 'Failed to update password.');
          }
        }
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/40">
        
        {mode === 'otp' && step === 'verify' && (
          <button 
            onClick={() => setStep('email')}
            className="flex items-center text-sm text-gray-500 hover:text-gray-800 transition-colors mb-4"
          >
            <ArrowLeft size={16} className="mr-1" /> Back
          </button>
        )}

        <div className="text-center mb-8">
          <img src={logo} alt="IKIGAI Logo" className="h-14 w-auto mx-auto mb-4" />
          <p className="text-gray-500 font-medium">
            {mode === 'password' ? 'Welcome back!' : 
             step === 'optional-password' ? 'Set New Password (Optional)' : 'Login with OTP'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm text-center border border-red-100">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 text-green-600 p-4 rounded-xl mb-6 text-sm text-center border border-green-100">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {(mode === 'password' || (mode === 'otp' && step === 'email')) && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  className="w-full px-5 py-4 pl-12 rounded-xl border border-gray-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-primary-400 focus:border-transparent outline-none transition-all duration-200"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={step === 'verify'}
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              </div>
            </div>
          )}

          {mode === 'password' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full px-5 py-4 pl-12 pr-12 rounded-xl border border-gray-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-primary-400 focus:border-transparent outline-none transition-all duration-200"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
          )}

          {mode === 'otp' && step === 'verify' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">6-Digit OTP</label>
              <input
                type="text"
                required
                maxLength="6"
                className="w-full px-5 py-4 rounded-xl border border-gray-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-primary-400 focus:border-transparent outline-none transition-all duration-200 text-center tracking-[0.5em] font-bold text-lg"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              />
            </div>
          )}

          {mode === 'otp' && step === 'optional-password' && (
             <div>
              <p className="text-sm text-gray-600 mb-4 text-center">
                Since you used an OTP to bypass your password, would you like to set a new password for next time?
              </p>
              <label className="block text-sm font-semibold text-gray-700 mb-2">New Password (Optional)</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength="6"
                  className="w-full px-5 py-4 pl-12 pr-12 rounded-xl border border-gray-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-primary-400 focus:border-transparent outline-none transition-all duration-200"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-primary-500 to-primary-700 text-white font-semibold text-lg shadow-lg hover:shadow-primary-500/30 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Processing...' : (
                <>
                  <span>
                    {mode === 'password' ? 'Sign In' : 
                     step === 'email' ? 'Send OTP' : 
                     step === 'optional-password' ? 'Save Password & Continue' : 'Verify & Login'}
                  </span>
                  <LogIn size={20} />
                </>
              )}
            </button>

            {step === 'optional-password' && (
              <button
                type="button"
                onClick={() => navigate('/')}
                disabled={isLoading}
                className="w-full py-4 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <span>Skip for now</span>
                <ArrowRight size={18} />
              </button>
            )}
          </div>
        </form>

        {step !== 'optional-password' && (
          <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col gap-3">
            {mode === 'password' && (
              <button
                onClick={() => handleModeChange('otp')}
                className="w-full py-3 rounded-xl border-2 border-gray-100 text-gray-600 font-medium hover:bg-gray-50 hover:border-gray-200 transition-colors"
              >
                Login with OTP Instead
              </button>
            )}
            {mode === 'otp' && (
              <button
                onClick={() => handleModeChange('password')}
                className="w-full py-3 rounded-xl border-2 border-gray-100 text-gray-600 font-medium hover:bg-gray-50 hover:border-gray-200 transition-colors"
              >
                Back to Password Login
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
