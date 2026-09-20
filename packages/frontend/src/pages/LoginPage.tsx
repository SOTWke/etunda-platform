import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import Layout from '../components/Layout';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/products');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Layout>
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>🌱 eTunda Platform</h1>
          <h2 style={styles.subtitle}>Login</h2>

          {error && <div style={styles.error}>{error}</div>}

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={styles.input}
              />
            </div>

            <button type="submit" disabled={isLoading} style={styles.button}>
              {isLoading ? 'Loading...' : 'Login'}
            </button>
          </form>

          <p style={styles.footer}>
            Don&apos;t have an account? <Link to="/register">Register</Link>
          </p>
        </div>
      </div>
    </Layout>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '60vh',
  } as React.CSSProperties,
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    padding: '40px',
    width: '100%',
    maxWidth: '400px',
  } as React.CSSProperties,
  title: {
    fontSize: '28px',
    marginBottom: '8px',
    color: '#333',
    textAlign: 'center' as const,
  },
  subtitle: {
    fontSize: '20px',
    marginBottom: '24px',
    color: '#666',
    textAlign: 'center' as const,
  },
  form: {
    marginTop: '24px',
  } as React.CSSProperties,
  formGroup: {
    marginBottom: '16px',
  } as React.CSSProperties,
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box' as const,
    marginTop: '4px',
  },
  button: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '16px',
  } as React.CSSProperties,
  footer: {
    textAlign: 'center' as const,
    marginTop: '16px',
    fontSize: '14px',
  },
  error: {
    backgroundColor: '#ffebee',
    color: '#c62828',
    padding: '12px',
    borderRadius: '4px',
    marginBottom: '16px',
  } as React.CSSProperties,
};

export default LoginPage;
