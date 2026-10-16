<?php
declare(strict_types=1);

return [
    'username' => 'admin',

    // Lag salt/hash med tools/password-generator.html.
    'password' => [
        'iterations' => 600000,
        'salt' => 'LIM_INN_BASE64_SALT_HER',
        'hash' => 'LIM_INN_BASE64_HASH_HER',
    ],

    'session_name' => 'kopistatus_admin',
    'session_timeout_minutes' => 480,

    // Enkel brute-force-beskyttelse lagret i MariaDB.
    'max_failures' => 5,
    'failure_window_minutes' => 15,
    'block_minutes' => 15,
];
