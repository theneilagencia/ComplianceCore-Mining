// Utility functions for cookie management

export function setCookie(name: string, value: string, days = 7) {
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${name}=${value}; Expires=${expires}; Path=/; Secure; SameSite=Strict`;
}

export function deleteCookie(name: string) {
  document.cookie = `${name}=; Path=/; Max-Age=0; Secure; SameSite=Strict`;
}

export function getCookie(name: string) {
  return document.cookie.split('; ').find(c => c.startsWith(name + '='))?.split('=')[1];
}

