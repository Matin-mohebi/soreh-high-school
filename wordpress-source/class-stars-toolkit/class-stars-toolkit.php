<?php
/**
 * Plugin Name: Class Stars Toolkit
 * Description: ابزارهای تکمیلی قالب Class Stars شامل جست‌وجوی زنده اعضا، نوار پیشرفت صفحه، بازگشت به بالا و میانبرهای مدیریتی.
 * Version: 1.0.1
 * Requires at least: 6.0
 * Requires PHP: 7.4
 * Author: Class Stars
 * Text Domain: class-stars-toolkit
 */
if (!defined('ABSPATH')) exit;

final class Class_Stars_Toolkit {
    const VERSION = '1.0.1';

    public static function init() {
        add_action('wp_enqueue_scripts', [__CLASS__, 'assets']);
        add_action('wp_footer', [__CLASS__, 'controls'], 30);
        add_action('wp_dashboard_setup', [__CLASS__, 'dashboard']);
        add_filter('plugin_action_links_' . plugin_basename(__FILE__), [__CLASS__, 'action_links']);
    }

    /* تشخیص قالب Class Stars (حتی اگر پوشه‌ی قالب نام کمی متفاوتی داشته باشد) */
    private static function theme_ok() {
        if (function_exists('cs_items') && function_exists('cs_opt')) return true;
        $theme = wp_get_theme();
        foreach ([strtolower($theme->get_template()), strtolower($theme->get_stylesheet())] as $name) {
            if (strpos($name, 'class-stars') === 0) return true;
        }
        return false;
    }

    public static function assets() {
        if (is_admin()) return;
        if (!self::theme_ok()) return;
        wp_enqueue_style('class-stars-toolkit', plugin_dir_url(__FILE__) . 'assets/toolkit.css', [], self::VERSION);
        wp_enqueue_script('class-stars-toolkit', plugin_dir_url(__FILE__) . 'assets/toolkit.js', [], self::VERSION, true);
        wp_localize_script('class-stars-toolkit', 'ClassStarsToolkit', [
            'topLabel' => 'بازگشت به بالای صفحه',
            'staffLabel' => 'جست‌وجو در مدیر و معاونان',
            'studentsLabel' => 'جست‌وجو در دانش‌آموزان برتر',
            'searchPlaceholder' => 'نام، سمت، پایه یا توضیحات…',
            'emptyResult' => 'موردی با این عبارت پیدا نشد.',
            'resultLabel' => 'نتیجه',
        ]);
    }

    public static function controls() {
        if (is_admin()) return;
        if (!self::theme_ok()) return;
        echo '<div class="cst-progress" aria-hidden="true"><span></span></div>';
        echo '<button class="cst-top" type="button" aria-label="' . esc_attr__('بازگشت به بالای صفحه', 'class-stars-toolkit') . '" title="' . esc_attr__('بازگشت به بالای صفحه', 'class-stars-toolkit') . '" hidden><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 14 7-7 7 7M12 7v12"/></svg></button>';
    }

    public static function dashboard() {
        if (!current_user_can('edit_posts')) return;
        wp_add_dashboard_widget('cst_overview', 'ابزارهای کلاس استارز', [__CLASS__, 'dashboard_content']);
    }

    public static function dashboard_content() {
        $staff = wp_count_posts('staff');
        $students = wp_count_posts('student');
        $staff_count = isset($staff->publish) ? (int) $staff->publish : 0;
        $student_count = isset($students->publish) ? (int) $students->publish : 0;
        echo '<div class="cst-admin-summary" style="display:flex;gap:12px;flex-wrap:wrap">';
        echo '<div style="padding:12px 16px;background:#edf7ff;border:1px solid #c4e3fb;border-radius:10px;min-width:120px"><strong style="font-size:24px">' . esc_html(number_format_i18n($staff_count)) . '</strong><br>مدیران و معاونان</div>';
        echo '<div style="padding:12px 16px;background:#edf7ff;border:1px solid #c4e3fb;border-radius:10px;min-width:120px"><strong style="font-size:24px">' . esc_html(number_format_i18n($student_count)) . '</strong><br>دانش‌آموزان برتر</div>';
        echo '</div><p>برای مدیریت محتوا از میانبرهای زیر استفاده کنید.</p><p>';
        echo '<a class="button button-primary" href="' . esc_url(admin_url('post-new.php?post_type=staff')) . '">افزودن مدیر یا معاون</a> ';
        echo '<a class="button button-primary" href="' . esc_url(admin_url('post-new.php?post_type=student')) . '">افزودن دانش‌آموز</a> ';
        echo '<a class="button" href="' . esc_url(admin_url('customize.php')) . '">تنظیمات ظاهر و متن‌ها</a>';
        echo '</p><p style="color:#536b82">جست‌وجوی زنده در سایت، نوار پیشرفت مطالعه و دکمه بازگشت به بالا برای بازدیدکنندگان فعال است.</p>';
    }

    public static function action_links($links) {
        if (current_user_can('edit_posts')) {
            array_unshift($links, '<a href="' . esc_url(admin_url('index.php')) . '">پیشخوان</a>');
        }
        return $links;
    }
}
Class_Stars_Toolkit::init();
