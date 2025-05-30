// @ts-check

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.

 @type {import('@docusaurus/plugin-content-docs').SidebarsConfig}
 */
const sidebars = {
  // By default, Docusaurus generates a sidebar from the docs folder structure
  // tutorialSidebar: [{type: 'autogenerated', dirName: '.'}],
  defaultSidebar: [
    'index', 
    {type: 'link', href: '/plugin', label: 'Plugin Docs'}, 
    {type: 'link', href: '/vault', label: 'Vault Docs'},
    'ontology',
    'glossary',
  ],
  pluginSidebar: [{type: 'autogenerated', dirName: 'plugin'}],
  vaultSidebar: [{type: 'autogenerated', dirName: 'vault'}],


  // But you can create a sidebar manually
  /*
  tutorialSidebar: [
    'intro',
    'hello',
    {
      type: 'category',
      label: 'Tutorial',
      items: ['tutorial-basics/create-a-document'],
    },
  ],
   */
};

export default sidebars;
