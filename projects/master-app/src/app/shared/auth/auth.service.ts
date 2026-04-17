import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor() { }

  getToken() {
    return localStorage.getItem('token') || ''
  }

  getRefreshToken() {
    return localStorage.getItem('refreshToken') || ''
  }

  setToken(token) {
    localStorage.setItem('token', token)
  }

  setRefreshToken(refreshToken) {
    localStorage.setItem('refreshToken', refreshToken)
  }

  login(data) {
    this.setToken(data.token)
    this.setRefreshToken(data.refreshToken)
  }

  logout() {
    this.setToken('')
    this.setRefreshToken('')
    localStorage.removeItem('role_name')
  }

  isAuthenticated() {
    return !!this.getToken()
  }
}
