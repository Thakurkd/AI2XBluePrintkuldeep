export const useNavigation = () => {
  const navigate = (page) => {
    window.location.hash = `/${page}`;
  };

  return { navigate };
};
