
export interface FilePayload {
    name: string;
    mimeType: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    buffer: any;
}

/**
 * Options for action methods like click, fill, check, etc.
 * Modeled after Playwright's action options.
 */
export interface ActionOptions {
    /** Maximum time in milliseconds. Defaults to 2500ms. */
    timeout?: number;
    /** Bypasses actionability checks. Use with caution. */
    force?: boolean;
    /** Do not wait for the action to complete before continuing. */
    noWaitAfter?: boolean;
}

/**
 * Extended options for click actions.
 */
export interface ClickOptions extends ActionOptions {
    /** Clicks on the element at the specified position. */
    position?: { x: number; y: number };
    /** Number of clicks. Defaults to 1. */
    clickCount?: number;
    /** Time to wait between mousedown and mouseup in milliseconds. */
    delay?: number;
}

/**
 * Extended options for fill actions.
 */
export interface FillOptions extends ActionOptions {
    /** Focus the element before filling. Defaults to true. */
    focus?: boolean;
}

export interface Locator {
    click(options?: ClickOptions): Promise<void>;
    dblclick(options?: ClickOptions): Promise<void>;
    fill(value: string, options?: FillOptions): Promise<void>;
    textContent(): Promise<string | null>;
    inputValue(): Promise<string>;
    isVisible(): Promise<boolean>;
    isChecked(): Promise<boolean>;
    isDisabled(): Promise<boolean>;
    isEditable(): Promise<boolean>;
    check(options?: ActionOptions): Promise<void>;
    uncheck(options?: ActionOptions): Promise<void>;
    selectOption(value: string | string[], options?: ActionOptions): Promise<void>;
    getAttribute(name: string): Promise<string | null>;
    innerHTML(): Promise<string>;
    count(): Promise<number>;
    first(): Locator;
    last(): Locator;
    nth(index: number): Locator;
    focus(options?: ActionOptions): Promise<void>;
    blur(options?: ActionOptions): Promise<void>;
    clear(options?: ActionOptions): Promise<void>;
    dispatchEvent(type: string, eventInit?: CustomEventInit): Promise<void>;
    setInputFiles(files: FilePayload | FilePayload[], options?: ActionOptions): Promise<void>;
    dragTo(target: Locator, options?: ActionOptions): Promise<void>;
    dragAndDrop(target: Locator, options?: ActionOptions): Promise<void>;
    press(key: string, options?: ActionOptions): Promise<void>;
    evaluate<R, Arg>(
        pageFunction: (element: HTMLElement, arg: Arg) => R | Promise<R>,
        arg?: Arg,
    ): Promise<R>;
    locator(
        selector: string,
        options?: { hasText?: string | RegExp; has?: Locator },
    ): Locator;
    filter(options: { hasText?: string | RegExp; has?: Locator }): Locator;
    all(): Promise<Locator[]>;
    allTextContents(): Promise<string[]>;
    elementHandles(): Promise<HTMLElement[]>; // Internal helper exposed for filter({ has })
    getByRole(role: string, options?: LocatorOptions): Locator;
    getByText(text: string | RegExp, options?: { exact?: boolean }): Locator;
    getByLabel(text: string | RegExp, options?: { exact?: boolean }): Locator;
    getByPlaceholder(
        text: string | RegExp,
        options?: { exact?: boolean },
    ): Locator;
    getByTestId(testId: string): Locator;
    hover(options?: ActionOptions & { position?: { x: number; y: number } }): Promise<void>;
    waitFor(options?: {
        state?: 'attached' | 'detached' | 'visible' | 'hidden';
        timeout?: number;
    }): Promise<void>;
}

export interface LocatorOptions {
    name?: string | RegExp;
    exact?: boolean;
    checked?: boolean;
    disabled?: boolean;
    expanded?: boolean;
    pressed?: boolean;
    selected?: boolean;
    level?: number;
    includeHidden?: boolean;
}

export interface APIRequestContext {
    get(url: string, options?: unknown): Promise<APIResponse>;
    post(url: string, options?: unknown): Promise<APIResponse>;
    put(url: string, options?: unknown): Promise<APIResponse>;
    delete(url: string, options?: unknown): Promise<APIResponse>;
    fetch(url: string, options?: unknown): Promise<APIResponse>;
    storageState(
        options?: unknown,
    ): Promise<{ cookies: unknown[]; origins: unknown[] }>;
    newContext(options?: unknown): Promise<APIRequestContext>;
}

export interface APIResponse {
    ok(): boolean;
    status(): number;
    statusText(): string;
    headers(): Record<string, string>;
    json(): Promise<unknown>;
    text(): Promise<string>;
    body(): Promise<Buffer>;
}

export interface Route {
    fulfill(response: {
        status?: number;
        headers?: Record<string, string>;
        contentType?: string;
        body?: string | Buffer;
        json?: unknown;
        path?: string;
    }): Promise<void>;
    continue(options?: {
        method?: string;
        headers?: Record<string, string>;
        postData?: string | Buffer;
    }): Promise<void>;
    request(): APIRequest;
}

export interface APIRequest {
    url(): string;
    method(): string;
    headers(): Record<string, string>;
    postData(): string | null;
}

export interface Dialog {
    message(): string;
    type(): 'alert' | 'confirm' | 'prompt' | 'beforeunload';
    accept(promptText?: string): Promise<void>;
    dismiss(): Promise<void>;
    defaultValue(): string;
}

export interface BrowserContext {
    tracing: {
        start(options?: unknown): Promise<void>;
        stop(options?: unknown): Promise<void>;
    };
    cookies(): Promise<unknown[]>;
    addCookies(cookies: unknown[]): Promise<void>;
    clearCookies(): Promise<void>;
    newPage(): Promise<any>;
    close(): Promise<void>;
    request: APIRequestContext;
}

export interface Browser {
    newContext(options?: unknown): Promise<BrowserContext>;
    close(): Promise<void>;
    version(): string;
}

export interface Keyboard {
    down(key: string): Promise<void>;
    up(key: string): Promise<void>;
    insertText(text: string): Promise<void>;
    type(text: string, options?: { delay?: number }): Promise<void>;
    press(key: string, options?: { delay?: number }): Promise<void>;
}

export interface Mouse {
    move(x: number, y: number, options?: { steps?: number }): Promise<void>;
    down(options?: {
        button?: 'left' | 'right' | 'middle';
        clickCount?: number;
    }): Promise<void>;
    up(options?: {
        button?: 'left' | 'right' | 'middle';
        clickCount?: number;
    }): Promise<void>;
    click(
        x: number,
        y: number,
        options?: {
            delay?: number;
            button?: 'left' | 'right' | 'middle';
            clickCount?: number;
        },
    ): Promise<void>;
    dblclick(
        x: number,
        y: number,
        options?: { delay?: number; button?: 'left' | 'right' | 'middle' },
    ): Promise<void>;
}

export interface FrameLocator {
    locator(selector: string): Locator;
    getByRole(role: string, options?: LocatorOptions): Locator;
    getByText(text: string | RegExp, options?: { exact?: boolean }): Locator;
    getByLabel(text: string | RegExp, options?: { exact?: boolean }): Locator;
    getByPlaceholder(
        text: string | RegExp,
        options?: { exact?: boolean },
    ): Locator;
    getByTestId(testId: string): Locator;
    first(): FrameLocator;
    last(): FrameLocator;
    nth(index: number): FrameLocator;
}

export interface WaitOptions {
    timeout?: number;
    state?: 'visible' | 'hidden' | 'attached' | 'detached';
}
