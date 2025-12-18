# Page Object Model (POM)

Design pattern for maintainable test automation.

---

## What is POM?

Separates page structure from test logic:

```javascript
class LoginPage {
    constructor(page) {
        this.page = page;
        this.emailInput = page.locator('#email');
        this.passwordInput = page.locator('#password');
        this.submitButton = page.locator('#submit');
    }

    async login(email, password) {
        await this.emailInput.fill(email);
        await this.passwordInput.fill(password);
        await this.submitButton.click();
    }
}
```

---

## Benefits

| Benefit | Description |
|---------|-------------|
| **Reusability** | Use same page in multiple tests |
| **Maintainability** | Change selector in one place |
| **Readability** | Tests read like user stories |

---

## Action Methods

```javascript
class CartPage {
    async addItem() {
        await this.addButton.click();
    }

    async getTotal() {
        return await this.totalLabel.textContent();
    }

    async checkout() {
        await this.checkoutButton.click();
        return new CheckoutPage(this.page);
    }
}
```

---

## Components

Extract reusable UI parts:

```javascript
class HeaderComponent {
    constructor(page) {
        this.container = page.locator('.header');
        this.logoutButton = this.container.locator('#logout');
    }

    async logout() {
        await this.logoutButton.click();
    }
}

class DashboardPage {
    constructor(page) {
        this.header = new HeaderComponent(page);
    }
}
```

---

## Page Navigation

Return next page from methods:

```javascript
class LoginPage {
    async login(email, password) {
        await this.emailInput.fill(email);
        await this.passwordInput.fill(password);
        await this.submitButton.click();
        return new HomePage(this.page);
    }
}

// Fluent usage
const home = await loginPage.login('user', 'pass');
const message = await home.getWelcome();
```

---

## Base Class

Share common functionality:

```javascript
class BasePage {
    constructor(page) {
        this.page = page;
    }

    async getTitle() {
        return await this.page.title();
    }
}

class ProductPage extends BasePage {
    async getPrice() {
        return await this.priceLabel.textContent();
    }
}
```

---

## Practice Challenges

1. [First Page Object](/challenges/pw-first-page-object)
2. [Encapsulate Actions](/challenges/pw-encapsulate-actions)
3. [Page Components](/challenges/pw-page-components)
4. [Page Navigation Pattern](/challenges/pw-page-navigation)
5. [Base Page Class](/challenges/pw-base-page-class)
