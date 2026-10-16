<?php
declare(strict_types=1);

require __DIR__ . '/auth.php';
admin_security_headers();

try {
    admin_start_session();
    $pdo = db();
} catch (Throwable $e) {
    error_log('admin init: ' . $e->getMessage());
    http_response_code(500);
    exit('Admin-oppsettet er ikke ferdig konfigurert. Se README i servicepakken.');
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = (string) ($_POST['action'] ?? '');

    if ($action === 'login') {
        admin_require_csrf();

        if (admin_is_blocked($pdo)) {
            admin_flash('For mange mislykkede innloggingsforsøk. Prøv igjen senere.', 'error');
        } else {
            $username = trim((string) ($_POST['username'] ?? ''));
            $password = (string) ($_POST['password'] ?? '');

            if (admin_verify_credentials($username, $password)) {
                admin_clear_failed_logins($pdo);
                admin_login($username);
                admin_flash('Innlogget.', 'ok');
            } else {
                admin_record_failed_login($pdo);
                // Litt ekstra forsinkelse mot automatiserte forsøk.
                usleep(700000);
                admin_flash('Feil brukernavn eller passord.', 'error');
            }
        }

        header('Location: ./');
        exit;
    }

    if (!admin_is_logged_in()) {
        http_response_code(403);
        exit('Ikke innlogget.');
    }

    admin_require_csrf();

    if ($action === 'logout') {
        admin_logout();
        header('Location: ./');
        exit;
    }

    $incidentId = filter_input(INPUT_POST, 'incident_id', FILTER_VALIDATE_INT);
    if (!$incidentId || $incidentId < 1) {
        admin_flash('Ugyldig hendelses-ID.', 'error');
        header('Location: ./');
        exit;
    }

    if ($action === 'report_service' || $action === 'update_note') {
        $note = trim((string) ($_POST['service_note'] ?? ''));
        if (function_exists('mb_strlen') && function_exists('mb_substr')) {
            if (mb_strlen($note, 'UTF-8') > 500) {
                $note = mb_substr($note, 0, 500, 'UTF-8');
            }
        } elseif (strlen($note) > 500) {
            $note = substr($note, 0, 500);
        }

        $stmt = $pdo->prepare(
            "UPDATE printer_incidents
             SET service_status = 'reported',
                 service_reported_at = COALESCE(service_reported_at, :service_reported_at),
                 service_note = :service_note,
                 service_reported_by = :service_reported_by
             WHERE id = :id
               AND resolved_at IS NULL
               AND severity IN ('critical','warning','other')"
        );
        $stmt->execute([
            ':service_reported_at' => (new DateTimeImmutable('now'))->format('Y-m-d H:i:s'),
            ':service_note' => $note !== '' ? $note : null,
            ':service_reported_by' => (string) $_SESSION['admin_username'],
            ':id' => $incidentId,
        ]);

        admin_flash(
            $stmt->rowCount() > 0
                ? 'Hendelsen er markert som meldt til service.'
                : 'Hendelsen kunne ikke oppdateres. Den kan allerede være løst.',
            $stmt->rowCount() > 0 ? 'ok' : 'error'
        );
    } elseif ($action === 'clear_service') {
        $stmt = $pdo->prepare(
            "UPDATE printer_incidents
             SET service_status = 'none',
                 service_reported_at = NULL,
                 service_note = NULL,
                 service_reported_by = NULL
             WHERE id = :id
               AND resolved_at IS NULL"
        );
        $stmt->execute([':id' => $incidentId]);
        admin_flash('Service-markeringen er fjernet.', 'ok');
    }

    header('Location: ./');
    exit;
}

$flash = admin_take_flash();
$loggedIn = admin_is_logged_in();
$blocked = !$loggedIn && admin_is_blocked($pdo);
$incidents = [];

if ($loggedIn) {
    $stmt = $pdo->query(
        "SELECT
            id, printer_name, printer_model, severity,
            error_message, error_code, opened_at,
            service_status, service_reported_at, service_note, service_reported_by
         FROM printer_incidents
         WHERE resolved_at IS NULL
           AND severity IN ('critical','warning','other')
         ORDER BY
           CASE service_status WHEN 'reported' THEN 0 ELSE 1 END,
           CASE severity WHEN 'critical' THEN 0 WHEN 'warning' THEN 1 ELSE 2 END,
           opened_at ASC"
    );
    $incidents = $stmt->fetchAll();
}

function format_admin_datetime(?string $value): string
{
    if (!$value) return '–';
    try {
        return (new DateTimeImmutable($value))->format('d.m.Y H:i');
    } catch (Throwable) {
        return $value;
    }
}

function format_admin_duration(mixed $seconds): string
{
    $seconds = max(0, (int) $seconds);
    if ($seconds < 60) return $seconds . ' sek';
    $minutes = intdiv($seconds, 60);
    if ($minutes < 60) return $minutes . ' min';
    $hours = intdiv($minutes, 60);
    if ($hours < 24) return $hours . 't ' . ($minutes % 60) . 'm';
    return intdiv($hours, 24) . 'd ' . ($hours % 24) . 't';
}
?>
<!doctype html>
<html lang="no">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>Kopimaskin status – Admin</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <main class="admin-shell">
    <header class="admin-header">
      <div>
        <h1>🔧 Kopimaskin service-admin</h1>
        <p>Merk aktive tekniske feil som meldt til ekstern service.</p>
      </div>
      <?php if ($loggedIn): ?>
        <form method="post" class="logout-form">
          <input type="hidden" name="csrf" value="<?= admin_escape(admin_csrf_token()) ?>">
          <input type="hidden" name="action" value="logout">
          <button type="submit" class="secondary-button">Logg ut</button>
        </form>
      <?php endif; ?>
    </header>

    <?php if ($flash): ?>
      <div class="flash <?= $flash['type'] === 'error' ? 'flash-error' : 'flash-ok' ?>">
        <?= admin_escape($flash['message']) ?>
      </div>
    <?php endif; ?>

    <?php if (!$loggedIn): ?>
      <section class="login-card">
        <h2>Logg inn</h2>
        <?php if ($blocked): ?>
          <p class="blocked-message">For mange mislykkede forsøk. Innlogging er midlertidig sperret.</p>
        <?php endif; ?>
        <form method="post" autocomplete="on">
          <input type="hidden" name="csrf" value="<?= admin_escape(admin_csrf_token()) ?>">
          <input type="hidden" name="action" value="login">
          <label>
            Brukernavn
            <input type="text" name="username" autocomplete="username" required <?= $blocked ? 'disabled' : '' ?>>
          </label>
          <label>
            Passord
            <input type="password" name="password" autocomplete="current-password" required <?= $blocked ? 'disabled' : '' ?>>
          </label>
          <button type="submit" <?= $blocked ? 'disabled' : '' ?>>Logg inn</button>
        </form>
      </section>
    <?php else: ?>
      <section class="admin-intro">
        <strong><?= count($incidents) ?></strong> aktive tekniske hendelser.
        Når en hendelse løses av loggeren, beholdes servicehistorikken automatisk på den avsluttede hendelsen.
      </section>

      <section class="incident-list">
        <?php if (!$incidents): ?>
          <div class="empty-state">Ingen aktive tekniske hendelser.</div>
        <?php endif; ?>

        <?php foreach ($incidents as $incident): ?>
          <?php $reported = $incident['service_status'] === 'reported'; ?>
          <article class="incident-card <?= $reported ? 'reported' : '' ?>">
            <div class="incident-heading">
              <div>
                <span class="severity severity-<?= admin_escape($incident['severity']) ?>"><?= admin_escape($incident['severity']) ?></span>
                <?php if ($reported): ?><span class="service-pill">🔧 Meldt til service</span><?php endif; ?>
                <h2><?= admin_escape($incident['printer_name']) ?> <small><?= admin_escape($incident['printer_model']) ?></small></h2>
              </div>
              <div class="incident-id">#<?= (int) $incident['id'] ?></div>
            </div>

            <p class="error-message">
              <?= admin_escape($incident['error_message']) ?>
              <?php if (!empty($incident['error_code'])): ?><code>{<?= admin_escape($incident['error_code']) ?>}</code><?php endif; ?>
            </p>

            <div class="incident-meta">
              <span>Oppstod <?= admin_escape(format_admin_datetime($incident['opened_at'])) ?></span>
              <span>Aktiv i <?= admin_escape(format_admin_duration(max(0, time() - (strtotime((string) $incident['opened_at']) ?: time())))) ?></span>
              <?php if ($reported): ?>
                <span>Meldt <?= admin_escape(format_admin_datetime($incident['service_reported_at'])) ?></span>
              <?php endif; ?>
            </div>

            <form method="post" class="service-form">
              <input type="hidden" name="csrf" value="<?= admin_escape(admin_csrf_token()) ?>">
              <input type="hidden" name="incident_id" value="<?= (int) $incident['id'] ?>">
              <label>
                Notat <small>(vises på den offentlige statussiden)</small>
                <textarea name="service_note" maxlength="500" rows="2" placeholder="F.eks. Meldt til Ricoh – avventer tekniker."><?= admin_escape($incident['service_note']) ?></textarea>
              </label>

              <div class="button-row">
                <?php if ($reported): ?>
                  <button type="submit" name="action" value="update_note">Lagre notat</button>
                  <button type="submit" name="action" value="clear_service" class="danger-button" formnovalidate>Fjern service-markering</button>
                <?php else: ?>
                  <button type="submit" name="action" value="report_service">🔧 Merk som meldt til service</button>
                <?php endif; ?>
              </div>
            </form>
          </article>
        <?php endforeach; ?>
      </section>
    <?php endif; ?>
  </main>
</body>
</html>
