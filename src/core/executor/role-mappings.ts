/**
 * Playwright Accessibility Role to HTML Tag Mapping
 */
export const ROLE_TO_TAG: Record<string, string> = {
    button: 'button, [role="button"], input[type="submit"], input[type="button"]',
    textbox:
        'input[type="text"], input[type="email"], input[type="password"], input:not([type]), textarea, [role="textbox"]',
    checkbox: 'input[type="checkbox"], [role="checkbox"]',
    radio: 'input[type="radio"], [role="radio"]',
    link: 'a, [role="link"]',
    heading: 'h1, h2, h3, h4, h5, h6, [role="heading"]',
    listitem: 'li, [role="listitem"]',
    img: 'img, [role="img"]',

    // Table-related roles
    cell: 'td, [role="cell"]',
    columnheader: 'th, [role="columnheader"]',
    row: 'tr, [role="row"]',
    rowheader: 'th[scope="row"], [role="rowheader"]',
    table: 'table, [role="table"]',
    rowgroup: 'thead, tbody, tfoot, [role="rowgroup"]',

    // List-related
    list: 'ul, ol, [role="list"]',

    // Form-related
    combobox: 'select, [role="combobox"]',
    option: 'option, [role="option"]',
    spinbutton: 'input[type="number"], [role="spinbutton"]',
    slider: 'input[type="range"], [role="slider"]',

    // Dialog/Modal
    dialog: 'dialog, [role="dialog"]',
    alertdialog: '[role="alertdialog"]',

    // Landmarks
    navigation: 'nav, [role="navigation"]',
    main: 'main, [role="main"]',
    banner: 'header, [role="banner"]',
    contentinfo: 'footer, [role="contentinfo"]',

    // Widgets
    tab: '[role="tab"]',
    tablist: '[role="tablist"]',
    tabpanel: '[role="tabpanel"]',
    menu: '[role="menu"]',
    menuitem: '[role="menuitem"]',
    progressbar: 'progress, [role="progressbar"]',
    meter: 'meter, [role="meter"]',
};
