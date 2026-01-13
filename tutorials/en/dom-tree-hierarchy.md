---
title: 'Foundation 2: Reading the DOM Tree (Hierarchy)'
description: 'Automation is about context. Learn to navigate the "Family Tree" of a web page.'
---

> Automation is about context. Learn to navigate the "Family Tree" of a web page.

When a browser loads a website, it turns the HTML code into a structure called the **DOM (Document Object Model)**. You can think of the DOM as a family tree where every element is connected to another.

## 1. The "Tree" Metaphor: The Root and Branches

![DOM Tree Model](/images/tutorials/dom-tree-model.png)

Every web page starts with a single "root" element: `<html>`. Everything else grows out of it.

* **The Root:** The `<html>` tag.
* **The Branches:** The `<head>` (hidden data like metadata) and the `<body>` (everything you see on the screen).
* **The Leaves:** The final elements, like buttons, text, or images.

---

## 2. Parent-Child Relationships (Nesting)

![Container View](/images/tutorials/dom-container-view.png)

When one element is placed inside another, we call this **Nesting**. This creates a **Parent-Child** relationship.

* **Parent:** The outer element that wraps around others.
* **Child:** The element living inside the parent.

**Example Code:**

```html
<form id="login-form">
  <input type="text" name="username">
</form>
```

In this example:

* The `<form>` is the **Parent**.
* The `<input>` is the **Child**.

> [!TIP]
> **Why this matters for QA:** Sometimes, a "Login" button doesn't have a unique ID, but the "Login Form" does. You can tell your automation script: "Go to the Login Form (Parent) and find the button (Child) inside it."

---

## 3. Siblings: Living on the Same Level

Elements that share the same immediate Parent are called **Siblings**. They live at the same "level" in the hierarchy.

**Example Code:**

```html
<ul>
  <li>Home</li>
  <li>About</li>
  <li>Contact</li>
</ul>
```

In this example, all three `<li>` tags are **Siblings** because they all live inside the same `<ul>` parent.

> [!TIP]
> **Why this matters for QA:** You will often use sibling relationships when you need to find an element based on its neighbor. For example: "Find the label that says 'Email,' then find the input field immediately after it."

---

## 4. Understanding Nesting and Indentation

![Indentation Guide](/images/tutorials/dom-indentation-guide.png)

In well-written code, you will notice that children are "pushed" to the right (indented). This helps us visually identify the hierarchy at a glance.

* **Indented code:** Usually indicates a child relationship to the line above it.
* **Aligned code:** Indicates elements are siblings of each other.

**Example of "Flat" vs. "Nested" view:**

```html
<!-- Hard to read -->
<div><form><label>Name</label><input></form></div>

<!-- Easy to read -->
<div>
  <form>
    <label>Name</label>
    <input>
  </form>
</div>
```

---

## The Reality Check: Visual Proximity vs. DOM Proximity

One common mistake for beginners is assuming that if two elements are near each other on the screen, they are siblings in the code.

**This is often false.** Developers use "Containers" (like `<div>` or `<span>`) to group things for styling. Two buttons might look like neighbors on your screen, but in the code, they might be in completely different "branches" of the tree.

> [!IMPORTANT]
> **The Rule:** Always trust the DOM tree structure in your DevTools over what you see on the UI.

---

## Summary Checklist

To master the DOM tree, you should be able to:

1. Identify the **Parent** of any given element.
2. Identify if two elements are **Siblings** (sharing the same parent).
3. Use **Indentation** to quickly spot which elements are nested inside others.

---

## 6. Further Reading (Deep Dive)

Explore the official definitions of the DOM layout.

### Official Documentation (MDN)

* **[Introduction to the DOM](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Introduction)**: A high-level overview of what the DOM really is.
* **[Traversing the DOM](https://developer.mozilla.org/en-US/docs/Web/API/Node)**: Detailed documentation on concepts like `parentNode`, `childNodes`, and `nextSibling`.
