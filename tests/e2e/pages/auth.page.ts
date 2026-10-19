import { Page, Locator, expect } from '@playwright/test';

export class AuthPage {
  readonly page: Page;
  readonly loginTab: Locator;
  readonly registerTab: Locator;

  // Login form locators
  readonly loginEmailInput: Locator;
  readonly loginPasswordInput: Locator;
  readonly loginSubmitBtn: Locator;
  readonly emailConfirmedBadge: Locator;
  readonly emailUnconfirmedBox: Locator;

  // Register form locators
  readonly registerDisplayNameInput: Locator;
  readonly registerEmailInput: Locator;
  readonly registerPasswordInput: Locator;
  readonly registerSubmitBtn: Locator;
  readonly activationNoticeCard: Locator;
  readonly passwordCriteriaBox: Locator;

  constructor(page: Page) {
    this.page = page;
    this.loginTab = page.locator('mat-tab-header .mdc-tab').filter({ hasText: 'Logowanie' });
    this.registerTab = page.locator('mat-tab-header .mdc-tab').filter({ hasText: 'Rejestracja' });

    // Login
    this.loginEmailInput = page.locator('form[formgroupname="loginForm"] input[type="email"], form:has-text("Zaloguj się") input[type="email"]');
    this.loginPasswordInput = page.locator('form:has-text("Zaloguj się") input[formcontrolname="password"]');
    this.loginSubmitBtn = page.locator('button[type="submit"]:has-text("Zaloguj się")');
    this.emailConfirmedBadge = page.locator('.email-confirmed-badge');
    this.emailUnconfirmedBox = page.locator('.email-unconfirmed-box');

    // Register
    this.registerDisplayNameInput = page.locator('input[formcontrolname="displayName"]');
    this.registerEmailInput = page.locator('form:has-text("Utwórz darmowe konto") input[formcontrolname="email"]');
    this.registerPasswordInput = page.locator('form:has-text("Utwórz darmowe konto") input[formcontrolname="password"]');
    this.registerSubmitBtn = page.locator('button[type="submit"]:has-text("Utwórz darmowe konto")');
    this.activationNoticeCard = page.locator('.activation-notice-card');
    this.passwordCriteriaBox = page.locator('.password-criteria-box');
  }

  async goto() {
    await this.page.goto('/auth');
    await expect(this.page.locator('.brand-header h1')).toHaveText('MacroGuard');
  }

  async switchToRegister() {
    await this.registerTab.click();
    await expect(this.registerSubmitBtn).toBeVisible();
  }

  async switchToLogin() {
    await this.loginTab.click();
    await expect(this.loginSubmitBtn).toBeVisible();
  }

  async register(displayName: string, email: string, pass: string) {
    await this.switchToRegister();
    await this.registerDisplayNameInput.fill(displayName);
    await this.registerEmailInput.fill(email);
    await this.registerPasswordInput.fill(pass);
    await expect(this.registerSubmitBtn).toBeEnabled();
    await this.registerSubmitBtn.click();
  }

  async login(email: string, pass: string) {
    await this.switchToLogin();
    await this.loginEmailInput.fill(email);
    await this.loginPasswordInput.fill(pass);
    await expect(this.loginSubmitBtn).toBeEnabled();
    await this.loginSubmitBtn.click();
  }

  async expectActivationCard(email: string) {
    await expect(this.activationNoticeCard).toBeVisible();
    await expect(this.activationNoticeCard).toContainText(email);
    await expect(this.activationNoticeCard).toContainText('Sprawdź swoją skrzynkę e-mail!');
  }

  async expectEmailConfirmedBadge() {
    await expect(this.emailConfirmedBadge).toBeVisible();
    await expect(this.emailConfirmedBadge).toContainText('Adres e-mail został pomyślnie potwierdzony!');
  }
}

