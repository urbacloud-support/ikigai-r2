import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROLES, STORAGE_KEYS } from '../config/constants';
import { authFetch } from '../config/api';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState(ROLES.EVALUATOR);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // Mock backend response since phase 8 implements the real auth endpoint
            // In a real flow, this uses authFetch('/auth/login', { method: 'POST', body: ... })
            
            // Mocking token for Phase 6 validation
            const fakeToken = "mock_jwt_token_for_phase_6";
            
            sessionStorage.setItem(STORAGE_KEYS.TOKEN, fakeToken);
            sessionStorage.setItem(STORAGE_KEYS.EMAIL, email);
            sessionStorage.setItem(STORAGE_KEYS.ROLE, role);

            // Role-based redirect
            if (role === ROLES.ADMIN) {
                navigate('/admin/events');
            } else if (role === ROLES.EVALUATOR) {
                navigate('/evaluator');
            } else if (role === ROLES.JUDGE) {
                navigate('/judge');
            } else if (role === ROLES.STUDENT_COORDINATOR) {
                navigate('/student');
            } else {
                navigate('/');
            }
        } catch (err) {
            setError('Login failed. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <img className="mx-auto h-24 w-auto object-contain" src="/ikigai.png" alt="Ikigai Logo" onError={(e) => e.target.style.display = 'none'} />
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Sign in to your account</h2>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow-xl sm:rounded-xl sm:px-10 border border-gray-100">
                    <form className="space-y-6" onSubmit={handleLogin}>
                        {error && <div className="text-red-600 bg-red-50 p-3 rounded-lg text-sm">{error}</div>}
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Role</label>
                            <select 
                                value={role} 
                                onChange={(e) => setRole(e.target.value)}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-lg border bg-gray-50"
                            >
                                <option value={ROLES.ADMIN}>Admin</option>
                                <option value={ROLES.EVALUATOR}>Evaluator</option>
                                <option value={ROLES.JUDGE}>Judge</option>
                                <option value={ROLES.STUDENT_COORDINATOR}>Student Coordinator</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email address</label>
                            <input 
                                type="email" 
                                required 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" 
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Password</label>
                            <input 
                                type="password" 
                                required 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" 
                            />
                        </div>

                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-colors"
                        >
                            {isLoading ? 'Signing in...' : 'Sign in'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;
