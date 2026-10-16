<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

try {
    $pdo = db();

    $stmt = $pdo->query(
        "SELECT
            id,
            printer_name,
            printer_model,
            severity,
            error_message,
            error_code,
            opened_at,
            service_reported_at,
            service_note
         FROM printer_incidents
         WHERE resolved_at IS NULL
           AND service_status = 'reported'
         ORDER BY service_reported_at ASC, id ASC"
    );

    $rows = $stmt->fetchAll();
    $printers = [];

    foreach ($rows as $row) {
        $key = (string) $row['printer_name'] . "\x1F" . (string) ($row['printer_model'] ?? '');

        if (!isset($printers[$key])) {
            $printers[$key] = [
                'printer_name' => (string) $row['printer_name'],
                'printer_model' => (string) ($row['printer_model'] ?? ''),
                'service_reported_at' => $row['service_reported_at'],
                'service_note' => '',
                'incident_count' => 0,
                'incidents' => [],
            ];
        }

        $note = trim((string) ($row['service_note'] ?? ''));
        if ($note !== '' && $printers[$key]['service_note'] === '') {
            $printers[$key]['service_note'] = $note;
        }

        $printers[$key]['incident_count']++;
        $printers[$key]['incidents'][] = [
            'severity' => (string) $row['severity'],
            'error_message' => (string) $row['error_message'],
            'error_code' => $row['error_code'],
            'opened_at' => $row['opened_at'],
        ];
    }

    json_response([
        'ok' => true,
        'service_version' => 1,
        'printers' => array_values($printers),
    ]);
} catch (Throwable $e) {
    error_log('service-status.php: ' . $e->getMessage());
    fail_json('Kunne ikke hente service-status.', 500);
}
