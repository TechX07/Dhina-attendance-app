import { Navigate } from 'react-router-dom';
import { getSession } from '../utils/auth';

export default function ProtectedRoute({ children, allowedRole }) {
    const session = getSession();

    if (!session) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRole && session.role !== allowedRole) {
        const redirect = session.role === 'admin' ? '/admin' : '/employee';
        return <Navigate to={redirect} replace />;
    }

    return children;
}
