export const isAuthenticated = (): boolean =>
  typeof window !== 'undefined' && localStorage.getItem('auth') === 'ok';

export const login = () => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth', 'ok');
  }
};

export const logout = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth');
  }
};
