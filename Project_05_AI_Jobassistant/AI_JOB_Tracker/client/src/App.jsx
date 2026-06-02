  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      authService
        .getMe()
        .then((res) => {
          setUser(res.data);
          return jobService.getAll();
        })
        .then((res) => {
          setJobs(res.data);
        })
        .catch(() => {
          localStorage.removeItem('token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [setUser, setJobs]);

  const handleLogin = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      setToken(response.data.token);
      setUser(response.data.user);
      const jobs = await jobService.getAll();
      setJobs(jobs.data);
    } catch (error) {
      alert('Login failed: ' + error.response?.data?.message);
    }
  };

  const handleRegister = async (name, email, password) => {
    try {
      const response = await authService.register(name, email, password);
      setToken(response.data.token);
      setUser(response.data.user);
      setJobs([]);
    } catch (error) {
      alert('Registration failed: ' + error.response?.data?.message);
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'board':
        return <Board />;
      case 'analytics':
        return <Analytics />;
      case 'ai-assistant':
        return <AIPage />;
      default:
        return <Dashboard />;
    }
  };

    // Render based on authentication state
    if (loading) {
      return <div className="flex h-screen items-center justify-center text-xl">Loading...</div>;
    }
    if (!isAuthenticated) {
      return (
        <Layout currentPage={currentPage} setCurrentPage={setCurrentPage}>
          {authMode === 'login' ? (
            <Login onLogin={handleLogin} onSwitchToRegister={() => setAuthMode('register')} />
          ) : (
            <Register onRegister={handleRegister} onSwitchToLogin={() => setAuthMode('login')} />
          )}
        </Layout>
      );
    }
    // User is authenticated, show main app layout
    return (
      <Layout currentPage={currentPage} setCurrentPage={setCurrentPage}>
        {renderPage()}
      </Layout>
    );
}
