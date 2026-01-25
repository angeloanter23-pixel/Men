<?php
/**
 * Foodie Premium SPA - Server Entry Point
 * Satisfies standard PHP deployment environments.
 */

// Enable basic security headers
header("X-Frame-Options: SAMEORIGIN");
header("X-Content-Type-Options: nosniff");
header("X-XSS-Protection: 1; mode=block");

// Define basic environment constants
define('APP_VERSION', '3.3.1');
define('PRODUCTION', true);

// Serve the primary application shell
if (file_exists("index.html")) {
    readfile("index.html");
} else {
    echo "<h1>Critical Error: Application Shell Missing.</h1>";
    exit(1);
}
?>