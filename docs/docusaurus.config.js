// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import {themes as prismThemes} from 'prism-react-renderer';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Personal OS',
  tagline: 'Transform Chaos into Clarity',
  favicon: 'img/POS-Logo.svg',

  // Set the production url of your site here
  url: 'https://docs.pers-os.com',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'GengAd', // Usually your GitHub org/user name.
  projectName: 'obsidian-personal-os', // Usually your repo name.
  deploymentBranch: 'gh-pages', // branch to deploy to

  onBrokenLinks: 'warn',
  onBrokenAnchors: 'ignore',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  // Add offline searching
  plugins: [
    require.resolve('docusaurus-lunr-search'),
    '@lunaticmuch/docusaurus-terminology',
  ],

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
          routeBasePath: "/",
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          // editUrl:
          //   'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
        },
        blog: {
          showReadingTime: false,
          postsPerPage: 5,
          blogSidebarCount: 'ALL',
          feedOptions: {type: null},
          // feedOptions: {
          //   type: ['rss', 'atom'],
          //   xslt: true,
          // },
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          // editUrl:
          //   'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
          // Useful options to enforce blogging best practices
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],
  markdown: {
    mermaid: true,
  },
  themes: ['@docusaurus/theme-mermaid'],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      colorMode: {
        defaultMode: 'dark',
        respectPrefersColorScheme: true,
      },
      docs: {
        sidebar: {
          //hideable: true,
          autoCollapseCategories: true,
        },
      },
      // Replace with your project's social card
      image: 'img/Personal_OS_Card.jpg',
      navbar: {
        title: '',
        logo: {
          alt: 'Personal OS Logo',
          src: 'img/POS-Logo-Title.svg',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'pluginSidebar',
            position: 'left',
            label: 'Plugin',
          },
          {
            type: 'docSidebar',
            sidebarId: 'vaultSidebar',
            position: 'left',
            label: 'Vault',
          },
          {to: '/blog', label: 'Releases', position: 'left'},
          // {
          //   href: 'https://github.com/GengAd/obsidian-personal-os/releases',
          //   label: 'Releases',
          //   position: 'left',
          // },
          {
            href: 'https://github.com/GengAd/obsidian-personal-os',
            //label: 'GitHub',
            position: 'right',
            className: 'header-github-link',
            'aria-label': 'GitHub repository',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            label: 'Personal OS',
            href: 'https://pers-os.com/',
          },
          {
            label: 'Discord',
            href: 'https://discord.gg/pgBrED8a',
          },
          {
            label: 'GitHub',
            href: 'https://github.com/GengAd/obsidian-personal-os',
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} WKTMTY. Built with Docusaurus.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
        additionalLanguages: ['typescript'],
      },
    }),
};

export default config;
