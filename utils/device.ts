const SM_BREAKPOINT = 640;

export const isMobile = () => {
  return window.innerWidth <= SM_BREAKPOINT;
};

export const modifierKey = () => {
  const userAgent = window.navigator.userAgent.toLowerCase();
  return userAgent.indexOf('mac') !== -1 ? 'Cmd' : 'Ctrl';
};
