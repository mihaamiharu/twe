---
title: 'Foundation 1: The Anatomy of an HTML Element'
description: 'Learn to read the blueprint of a web page before you start automating it.'
---

> Learn to read the "blueprint" of a web page before you start automating it.

As a Manual QA, you see a "Login Button." As an Automation Engineer, you must see the **code** that defines that button. HTML (HyperText Markup Language) is the language of that blueprint.

## 1. The Basic Structure

![HTML Element Anatomy](/images/tutorials/html-anatomy-diagram.png)

Every element is typically made of three parts:

* **The Opening Tag:** Tells the browser where the element starts (e.g., `<button>`).
* **The Content:** The text or other elements inside (e.g., `Login`).
* **The Closing Tag:** Tells the browser where the element ends (e.g., `</button>`).

**Example:**
`<button>Submit</button>`

---

## 2. Attributes and Values

![HTML Attribute Anatomy](/images/tutorials/html-attribute-anatomy.png)

This is the most important part for automation. Attributes provide extra information about an element. They always live inside the **Opening Tag**.

Imagine an attribute is a **Key** and the detail is the **Value**.

**Example:**
`<input type="text" id="username" placeholder="Enter your name">`

* **Attribute (Key):** `type` | **Value:** `"text"`
* **Attribute (Key):** `id` | **Value:** `"username"`
* **Attribute (Key):** `placeholder` | **Value:** `"Enter your name"`

> [!TIP]
> **QA Pro-Tip:** When writing automation, you are essentially telling your script: "Find the element where the attribute **id** has the value **username**."

---

## 3. Common Tags You Need to Know

You don't need to be a Web Developer, but you must recognize these "building blocks" because they behave differently in automation:

| Tag | Purpose | Why it matters for QA |
| --- | --- | --- |
| `<a>` | Link | You usually **click** these to navigate. They almost always have an `href` attribute. |
| `<button>` | Button | You **click** these to submit forms or trigger actions. |
| `<input>` | Input Field | You **type** (send keys) into these. |
| `<div>` | Container | A generic box used for layout. Usually "invisible" to the user but holds other elements. |
| `<span>` | Text Container | Used for small bits of text, like error messages or labels. |

---

## 4. Text Content vs. Attributes

![Text vs Attribute](/images/tutorials/html-text-vs-attribute.png)

New automation engineers often confuse **Text** with **Attributes**.

* **Text:** Sits *between* the opening and closing tags. It is what the user sees on the screen.
* **Attribute:** Sits *inside* the opening tag. It is metadata used by the browser or the developer.

**The Difference:**
`<button id="login-btn">Login Now</button>`

* **Attribute Value:** `login-btn` (Used for finding the element).
* **Text Content:** `Login Now` (Used for verifying what the user sees).

---

## 5. Self-Closing Tags

![Normal vs Self-Closing](/images/tutorials/html-self-closing.png)

Not every element has a "Closing Tag" or "Text Content." Some are "Self-Closing" because they don't hold anything else inside them; they just exist as a single unit.

**Examples:**

* `<input type="text">` (An input field)
* `<img src="logo.png">` (An image)
* `<br>` (A line break)

**Why this matters:** When you are looking for an element in the DOM, don't be confused if you don't see a `</input>` or `</img>`. It’s not a bug; it's just how those tags are designed.

---

## Summary Checklist

Before moving to the next foundation, make sure you can answer these:

1. Can you identify the **Tag Name** of an element?
2. Can you list the **Attributes** and their **Values**?
3. Do you know the difference between the **ID attribute** and the **Text content**?

---

## 6. Further Reading (Deep Dive)

To dive deeper into the official specs:

### Official Documentation (MDN)

* **[Anatomy of an HTML Element](https://developer.mozilla.org/en-US/docs/Learn/HTML/Introduction_to_HTML/Getting_started#anatomy_of_an_html_element)**: A visual guide to tags, attributes, and nesting.
* **[HTML Attributes Reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes)**: The complete list of global attributes like `id`, `class`, and `hidden`.
