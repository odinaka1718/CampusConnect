import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, validateNileUniversityEmail } from '../../contexts/AuthContext';
import { Mail, Lock, User, Hash, Building, BookOpen, AlertCircle, Loader2, CheckCircle } from 'lucide-react';

// Nile University Faculties and Departments
const FACULTIES = {
    'Engineering': [
        'Computer Engineering',
        'Electrical Engineering',
        'Mechanical Engineering',
        'Civil Engineering',
        'Petroleum Engineering'
    ],
    'Computing and Information Science': [
        'Computer Science',
        'Cyber Security',
        'Information Technology',
        'Software Engineering'
    ],
    'Management Sciences': [
        'Business Administration',
        'Accounting',
        'Economics',
        'Banking and Finance'
    ],
    'Natural and Applied Sciences': [
        'Biology',
        'Chemistry',
        'Physics',
        'Mathematics'
    ],
    'Law': [
        'Common Law',
        'Islamic Law'
    ],
    'Environmental Sciences': [
        'Architecture',
        'Urban Planning',
        'Environmental Management'
    ]
};

const Signup = () => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        username: '',
        full_name: '',
        reg_number: '',
        faculty: '',
        department: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { signup } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
            ...(name === 'faculty' ? { department: '' } : {})
        }));
    };

    const validateStep1 = () => {
        if (!validateNileUniversityEmail(formData.email)) {
            setError('Only Nile University email addresses (@nileuniversity.edu.ng) are allowed.');
            return false;
        }
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters.');
            return false;
        }
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match.');
            return false;
        }
        return true;
    };

    const validateStep2 = () => {
        if (!formData.username || formData.username.length < 3) {
            setError('Username must be at least 3 characters.');
            return false;
        }
        if (!formData.full_name) {
            setError('Full name is required.');
            return false;
        }
        if (!formData.reg_number) {
            setError('Registration number is required.');
            return false;
        }
        return true;
    };

    const handleNext = () => {
        setError('');
        if (step === 1 && validateStep1()) {
            setStep(2);
        } else if (step === 2 && validateStep2()) {
            setStep(3);
        }
    };

    const handleBack = () => {
        setError('');
        setStep(step - 1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.faculty || !formData.department) {
            setError('Please select your faculty and department.');
            return;
        }

        setLoading(true);

        try {
            await signup(formData.email, formData.password, {
                username: formData.username,
                full_name: formData.full_name,
                reg_number: formData.reg_number,
                faculty: formData.faculty,
                department: formData.department
            });
            navigate('/');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const departments = formData.faculty ? FACULTIES[formData.faculty] : [];

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo and Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-600 text-white text-2xl font-bold mb-4">
                        CC
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">Join CampusConnect</h1>
                    <p className="text-gray-600 mt-2">Create your account</p>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-center mb-6">
                    <div className="flex items-center gap-2">
                        {[1, 2, 3].map((s) => (
                            <div key={s} className="flex items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${s < step ? 'bg-green-500 text-white' :
                                    s === step ? 'bg-violet-600 text-white' :
                                        'bg-gray-200 text-gray-500'
                                    }`}>
                                    {s < step ? <CheckCircle className="w-5 h-5" /> : s}
                                </div>
                                {s < 3 && <div className={`w-12 h-1 mx-1 ${s < step ? 'bg-green-500' : 'bg-gray-200'}`} />}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Signup Form */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Step 1: Email & Password */}
                        {step === 1 && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        University Email
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="you@nileuniversity.edu.ng"
                                            className="input-field pl-10"
                                            required
                                        />
                                    </div>
                                    <p className="mt-1 text-xs text-gray-500">Must be a valid Nile University email</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            placeholder="Create a password"
                                            className="input-field pl-10"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Confirm Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            placeholder="Confirm your password"
                                            className="input-field pl-10"
                                            required
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Step 2: Personal Info */}
                        {step === 2 && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Username
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">@</span>
                                        <input
                                            type="text"
                                            name="username"
                                            value={formData.username}
                                            onChange={handleChange}
                                            placeholder="Choose a username"
                                            className="input-field pl-10"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Full Name
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            name="full_name"
                                            value={formData.full_name}
                                            onChange={handleChange}
                                            placeholder="Your full name"
                                            className="input-field pl-10"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Registration Number
                                    </label>
                                    <div className="relative">
                                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            name="reg_number"
                                            value={formData.reg_number}
                                            onChange={handleChange}
                                            placeholder="e.g., NU/2024/12345"
                                            className="input-field pl-10"
                                            required
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Step 3: Academic Info */}
                        {step === 3 && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Faculty
                                    </label>
                                    <div className="relative">
                                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <select
                                            name="faculty"
                                            value={formData.faculty}
                                            onChange={handleChange}
                                            className="input-field pl-10 appearance-none"
                                            required
                                        >
                                            <option value="">Select your faculty</option>
                                            {Object.keys(FACULTIES).map(faculty => (
                                                <option key={faculty} value={faculty}>{faculty}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Department
                                    </label>
                                    <div className="relative">
                                        <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <select
                                            name="department"
                                            value={formData.department}
                                            onChange={handleChange}
                                            className="input-field pl-10 appearance-none"
                                            required
                                            disabled={!formData.faculty}
                                        >
                                            <option value="">Select your department</option>
                                            {departments.map(dept => (
                                                <option key={dept} value={dept}>{dept}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Navigation Buttons */}
                        <div className="flex gap-3">
                            {step > 1 && (
                                <button
                                    type="button"
                                    onClick={handleBack}
                                    className="flex-1 btn-secondary py-3"
                                >
                                    Back
                                </button>
                            )}

                            {step < 3 ? (
                                <button
                                    type="button"
                                    onClick={handleNext}
                                    className="flex-1 btn-primary py-3"
                                >
                                    Continue
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 btn-primary py-3 flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Creating Account...
                                        </>
                                    ) : (
                                        'Create Account'
                                    )}
                                </button>
                            )}
                        </div>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-gray-600">
                            Already have an account?{' '}
                            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Signup;
