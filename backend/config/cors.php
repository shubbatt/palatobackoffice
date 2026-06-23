<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie', 'up'],

    'allowed_methods' => ['*'],

    /*
     * Allow the specific origins for local dev and production.
     * NEVER use ['*'] when supports_credentials is true — browsers will block it.
     */
    'allowed_origins' => [
        'http://localhost:3000',
        'http://localhost:3001',
        'https://app.palato.mv',
    ],

    'allowed_origins_patterns' => [
        '#^https://.*\.vercel\.app$#',
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    /*
     * Must be true so the Authorization bearer token cookie is forwarded.
     * Requires allowed_origins to list specific origins (not wildcard).
     */
    'supports_credentials' => true,
];
