<?php
/**
 * Soreh School contacts for the Class Stars WordPress theme.
 *
 * Add this file to the active theme directory and load it from functions.php:
 * require_once get_template_directory() . '/school-contacts.php';
 *
 * Then place [soreh_school_contacts] in a page, widget, or footer block.
 */

if (!defined('ABSPATH')) {
    exit;
}

if (!function_exists('cs_soreh_school_contacts_shortcode')) {
    function cs_soreh_school_contacts_shortcode() {
        $contacts = array(
            array(
                'label' => 'شعبه پسران',
                'phone_display' => '۰۲۴-۳۳۸۷۶۰۳۰',
                'phone_uri' => '+982433876030',
            ),
            array(
                'label' => 'شعبه دختران',
                'phone_display' => '۰۲۴-۳۳۴۲۰۱۹۷',
                'phone_uri' => '+982433420197',
            ),
            array(
                'label' => 'تلفن همراه شعبه دختران',
                'phone_display' => '۰۹۰۲۲۴۲۵۴۷۶',
                'phone_uri' => '+989022425476',
            ),
        );

        ob_start();
        ?>
        <section class="cs-school-contacts" dir="rtl" aria-labelledby="cs-school-contacts-title">
            <h2 id="cs-school-contacts-title">راه‌های ارتباط با مدرسه سوره زنجان</h2>
            <ul class="cs-school-contacts__list">
                <?php foreach ($contacts as $contact) : ?>
                    <li class="cs-school-contacts__item">
                        <span class="cs-school-contacts__label"><?php echo esc_html($contact['label']); ?></span>
                        <a class="cs-school-contacts__phone" href="<?php echo esc_attr('tel:' . $contact['phone_uri']); ?>">
                            <?php echo esc_html($contact['phone_display']); ?>
                        </a>
                    </li>
                <?php endforeach; ?>
            </ul>
            <p class="cs-school-contacts__website">
                <a href="https://www.sooreh-honar.ir/portal/index.html" target="_blank" rel="noopener noreferrer">
                    وب‌سایت رسمی مدرسه
                </a>
            </p>
        </section>
        <?php
        return ob_get_clean();
    }

    add_shortcode('soreh_school_contacts', 'cs_soreh_school_contacts_shortcode');
}
