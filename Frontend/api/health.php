<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

try {
    $pdo = db();
    $rules = load_error_rules();

    $incidentCount = (int) scalar_query($pdo, 'SELECT COUNT(*) FROM printer_incidents');
    $activeCount = (int) scalar_query($pdo, 'SELECT COUNT(*) FROM printer_active_errors');
    $tonerCount = (int) scalar_query($pdo, "SELECT COUNT(*) FROM printer_incidents WHERE severity = 'toner'");
    $paperCount = (int) scalar_query($pdo, "SELECT COUNT(*) FROM printer_incidents WHERE severity = 'paper'");

    $serviceColumns = (int) scalar_query(
        $pdo,
        "SELECT COUNT(*)
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'printer_incidents'
           AND COLUMN_NAME IN ('service_status','service_reported_at','service_note','service_reported_by')"
    );

    $adminRateLimitTable = (int) scalar_query(
        $pdo,
        "SELECT COUNT(*)
         FROM information_schema.TABLES
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'admin_login_attempts'"
    );

    json_response([
        'ok' => true,
        'logger_version' => 3,
        'service_version' => 1,
        'database' => 'connected',
        'rules' => 'loaded',
        'rule_groups' => array_values(array_intersect(['ignore','toner','paper','critical','warning'], array_keys($rules))),
        'incidents' => $incidentCount,
        'active_errors' => $activeCount,
        'toner_incidents' => $tonerCount,
        'paper_incidents' => $paperCount,
        'service_tracking' => $serviceColumns === 4,
        'admin_rate_limit' => $adminRateLimitTable === 1,
        'server_time' => (new DateTimeImmutable())->format(DateTimeInterface::ATOM),
        'timezone' => date_default_timezone_get(),
    ]);
} catch (Throwable $e) {
    error_log('health.php: ' . $e->getMessage());
    fail_json('Health check feilet.', 500, [
        'hint' => 'Kontroller api/config.php og at SQL-migreringene er kjørt.',
    ]);
}
