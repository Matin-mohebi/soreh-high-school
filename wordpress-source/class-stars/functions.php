<?php
if (!defined('ABSPATH')) exit;

/* ---------- 1. متن‌های قابل ویرایش (Customizer) ----------
   هر مورد: [برچسب, نوع (text|textarea|image), مقدار پیش‌فرض] */
function cs_fields() {
	return [
		'cs_hero' => ['title' => 'بخش اول صفحه', 'f' => [
			'school_name' => ['نام مدرسه', 'text', 'نام مدرسه شما'],
			'hero_text'   => ['معرفی کوتاه زیر عنوان', 'textarea', 'جایی برای دیده شدن بهترین‌ها؛ مدیران، معاونان و دانش‌آموزان برتر کلاس.'],
			'hero_image'  => ['عکس بالای صفحه (اختیاری)', 'image', ''],
		]],
		'cs_about' => ['title' => 'درباره مدرسه و آمار', 'f' => [
			'about_title' => ['عنوان درباره', 'text', 'مدرسه‌ای که یادگیری را جدی می‌گیرد'],
			'about_text'  => ['متن درباره مدرسه', 'textarea', 'اینجا چند خط درباره تاریخچه، هدف و روش آموزشی مدرسه بنویسید.'],
			'stat1_n' => ['آمار ۱ - عدد', 'text', '1200'], 'stat1_l' => ['آمار ۱ - عنوان', 'text', 'دانش‌آموز'],
			'stat2_n' => ['آمار ۲ - عدد', 'text', '80'],   'stat2_l' => ['آمار ۲ - عنوان', 'text', 'معلم'],
			'stat3_n' => ['آمار ۳ - عدد', 'text', '25'],   'stat3_l' => ['آمار ۳ - عنوان', 'text', 'سال سابقه'],
		]],
		'cs_staff' => ['title' => 'بخش مدیر و معاونان', 'f' => [
			'staff_title'     => ['عنوان بخش', 'text', 'مدیر و معاونان'],
			'staff_text'      => ['توضیح بخش', 'textarea', 'تیمی که مدرسه را اداره می‌کند.'],
			'gate_staff_text' => ['متن کارت ورودی سایت', 'text', 'با مدیر و معاونان آشنا شوید'],
		]],
		'cs_students' => ['title' => 'بخش دانش‌آموزان برتر', 'f' => [
			'students_title'     => ['عنوان بخش', 'text', 'دانش‌آموزان برتر'],
			'students_text'      => ['توضیح بخش', 'textarea', 'کسانی که با تلاش خودشان الگوی بقیه شدند.'],
			'gate_students_text' => ['متن کارت ورودی سایت', 'text', 'برترین‌های کلاس را ببینید'],
		]],
		'cs_footer' => ['title' => 'پایین صفحه', 'f' => [
			'address' => ['آدرس', 'text', ''],
			'phone'   => ['تلفن', 'text', ''],
			'note'    => ['یادداشت پایین صفحه', 'text', 'همه حقوق محفوظ است.'],
		]],
	];
}
function cs_all() {
	static $a = null;
	if ($a === null) {
		$a = [];
		foreach (cs_fields() as $s) foreach ($s['f'] as $k => $f) $a[$k] = $f;
	}
	return $a;
}
function cs_opt($k) {
	$f = cs_all()[$k] ?? ['', 'text', ''];
	return get_theme_mod($k, $f[2]);
}
function cs_text($k) { return nl2br(esc_html(cs_opt($k))); }

add_action('customize_register', function ($wp) {
	foreach (cs_fields() as $sid => $sec) {
		$wp->add_section($sid, ['title' => $sec['title'], 'priority' => 30]);
		foreach ($sec['f'] as $k => $f) {
			$cb = $f[1] === 'image' ? 'esc_url_raw' : ($f[1] === 'textarea' ? 'sanitize_textarea_field' : 'sanitize_text_field');
			$wp->add_setting($k, ['default' => $f[2], 'sanitize_callback' => $cb]);
			if ($f[1] === 'image') {
				$wp->add_control(new WP_Customize_Image_Control($wp, $k, ['label' => $f[0], 'section' => $sid]));
			} else {
				$wp->add_control($k, ['label' => $f[0], 'section' => $sid, 'type' => $f[1] === 'textarea' ? 'textarea' : 'text']);
			}
		}
	}
});

/* ---------- 2. تنظیمات پایه قالب ---------- */
add_action('after_setup_theme', function () {
	add_theme_support('title-tag');
	add_theme_support('post-thumbnails');
	add_theme_support('html5', ['search-form', 'gallery', 'caption', 'style', 'script']);
	add_image_size('cs-portrait', 720, 900, true);
	add_image_size('cs-square', 640, 640, true);
});

add_action('wp_enqueue_scripts', function () {
	wp_enqueue_style('cs-font', 'https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;600;800&display=swap', [], null);
	wp_enqueue_style('cs-style', get_stylesheet_uri(), ['cs-font'], wp_get_theme()->get('Version'));
	wp_enqueue_script('cs-app', get_template_directory_uri() . '/assets/app.js', [], wp_get_theme()->get('Version'), true);
});

add_filter('show_admin_bar', function ($show) { return current_user_can('edit_posts') ? $show : false; });

/* ---------- 3. نوع محتوای مدیران و دانش‌آموزان ---------- */
function cs_register_types() {
	register_post_type('staff', [
		'labels' => ['name' => 'مدیر و معاونان', 'singular_name' => 'عضو مدیریت', 'add_new' => 'افزودن عضو', 'add_new_item' => 'افزودن مدیر یا معاون', 'edit_item' => 'ویرایش', 'all_items' => 'همه اعضا'],
		'public' => true, 'show_in_rest' => true, 'has_archive' => false, 'menu_position' => 5,
		'menu_icon' => 'dashicons-businessperson', 'rewrite' => ['slug' => 'staff'],
		'supports' => ['title', 'editor', 'excerpt', 'thumbnail', 'page-attributes'],
	]);
	register_post_type('student', [
		'labels' => ['name' => 'دانش‌آموزان برتر', 'singular_name' => 'دانش‌آموز', 'add_new' => 'افزودن دانش‌آموز', 'add_new_item' => 'افزودن دانش‌آموز برتر', 'edit_item' => 'ویرایش', 'all_items' => 'همه دانش‌آموزان'],
		'public' => true, 'show_in_rest' => true, 'has_archive' => false, 'menu_position' => 6,
		'menu_icon' => 'dashicons-awards', 'rewrite' => ['slug' => 'student'],
		'supports' => ['title', 'editor', 'thumbnail', 'page-attributes'],
	]);
}
add_action('init', 'cs_register_types');

add_action('add_meta_boxes', function () {
	add_meta_box('cs_staff_meta', 'اطلاعات عضو', function ($p) {
		cs_meta_inputs($p, ['cs_role' => 'سمت (مثلا: معاون آموزشی)']);
		echo '<p class="description">ترتیب نمایش را از «ویژگی‌های برگه ← ترتیب» تغییر دهید.</p>';
	}, 'staff', 'side');
	add_meta_box('cs_student_meta', 'اطلاعات دانش‌آموز', function ($p) {
		cs_meta_inputs($p, ['cs_rank' => 'رتبه (مثلا: ۱)', 'cs_grade' => 'پایه (مثلا: دهم ریاضی)', 'cs_note' => 'نکته کوتاه (مثلا: برتر المپیاد)']);
		echo '<p class="description">ترتیب نمایش را از «ویژگی‌های برگه ← ترتیب» تغییر دهید.</p>';
	}, 'student', 'side');
});
function cs_meta_inputs($post, $fields) {
	wp_nonce_field('cs_meta', 'cs_meta_n');
	foreach ($fields as $k => $label) {
		printf('<p><label>%s<br><input type="text" class="widefat" name="%s" value="%s"></label></p>',
			esc_html($label), esc_attr($k), esc_attr(get_post_meta($post->ID, $k, true)));
	}
}
function cs_save_meta($post_id) {
	if (!isset($_POST['cs_meta_n']) || !wp_verify_nonce($_POST['cs_meta_n'], 'cs_meta')) return;
	if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) return;
	if (!current_user_can('edit_post', $post_id)) return;
	foreach (['cs_role', 'cs_rank', 'cs_grade', 'cs_note'] as $k) {
		if (isset($_POST[$k])) update_post_meta($post_id, $k, sanitize_text_field(wp_unslash($_POST[$k])));
	}
}
add_action('save_post_staff', 'cs_save_meta');
add_action('save_post_student', 'cs_save_meta');

function cs_items($type) {
	return get_posts(['post_type' => $type, 'post_status' => 'publish', 'numberposts' => 40,
		'orderby' => ['menu_order' => 'ASC', 'date' => 'DESC']]);
}

/* میانبر ویرایش برای مدیر سایت (روی خود صفحه دیده می‌شود) */
function cs_edit_link($url, $label = 'ویرایش') {
	if (current_user_can('edit_posts')) {
		echo '<a class="edit" href="' . esc_url($url) . '">' . esc_html($label) . '</a>';
	}
}
function cs_customize_url($section) {
	return admin_url('customize.php?autofocus[section]=' . $section . '&url=' . rawurlencode(home_url('/')));
}

/* ویجت پیشخوان وردپرس */
add_action('wp_dashboard_setup', function () {
	wp_add_dashboard_widget('cs_quick', 'پنل سریع مدرسه', function () {
		echo '<p><a class="button button-primary" href="' . esc_url(admin_url('post-new.php?post_type=staff')) . '">افزودن مدیر یا معاون</a> ';
		echo '<a class="button button-primary" href="' . esc_url(admin_url('post-new.php?post_type=student')) . '">افزودن دانش‌آموز برتر</a></p>';
		echo '<p><a class="button" href="' . esc_url(cs_customize_url('cs_hero')) . '">ویرایش متن‌ها و عکس صفحه اول</a> ';
		echo '<a class="button" href="' . esc_url(admin_url('users.php')) . '">کاربران ثبت‌نام شده</a></p>';
	});
});

/* ---------- 4. ساخت صفحه‌های ورود و ثبت‌نام هنگام فعال‌سازی ---------- */
add_action('after_switch_theme', function () {
	cs_register_types();
	foreach (['login' => ['ورود', '[cs_login]'], 'register' => ['ثبت‌نام', '[cs_register]']] as $slug => $d) {
		if (!get_page_by_path($slug)) {
			wp_insert_post(['post_type' => 'page', 'post_status' => 'publish', 'post_title' => $d[0], 'post_name' => $slug, 'post_content' => $d[1]]);
		}
	}
	flush_rewrite_rules();
});

/* ---------- 5. ثبت‌نام و ورود از روی خود سایت ---------- */
function cs_back($code = '', $page = '') {
	$back = wp_get_referer() ?: home_url($page ? '/' . $page . '/' : '/');
	$back = remove_query_arg('cs_err', $back);
	if ($code) $back = add_query_arg('cs_err', $code, $back);
	wp_safe_redirect($back);
	exit;
}

add_action('admin_post_nopriv_cs_register', function () {
	if (!isset($_POST['cs_n']) || !wp_verify_nonce($_POST['cs_n'], 'cs_register')) cs_back('nonce', 'register');
	if (!empty($_POST['website'])) cs_back('nonce', 'register'); // تله ضد ربات
	$user  = sanitize_user(wp_unslash($_POST['user'] ?? ''), true);
	$email = sanitize_email(wp_unslash($_POST['email'] ?? ''));
	$name  = sanitize_text_field(wp_unslash($_POST['name'] ?? ''));
	$pass  = (string) wp_unslash($_POST['pass'] ?? '');
	if (strlen($user) < 3 || !is_email($email)) cs_back('fields', 'register');
	if (strlen($pass) < 8) cs_back('pass', 'register');
	if (username_exists($user)) cs_back('user', 'register');
	if (email_exists($email)) cs_back('email', 'register');
	$id = wp_create_user($user, $pass, $email);
	if (is_wp_error($id)) cs_back('fail', 'register');
	wp_update_user(['ID' => $id, 'display_name' => $name ?: $user, 'role' => 'subscriber']);
	wp_set_current_user($id);
	wp_set_auth_cookie($id);
	wp_safe_redirect(home_url('/'));
	exit;
});

add_action('admin_post_nopriv_cs_login', function () {
	if (!isset($_POST['cs_n']) || !wp_verify_nonce($_POST['cs_n'], 'cs_login')) cs_back('nonce', 'login');
	$u = wp_signon([
		'user_login'    => sanitize_text_field(wp_unslash($_POST['user'] ?? '')),
		'user_password' => (string) wp_unslash($_POST['pass'] ?? ''),
		'remember'      => !empty($_POST['remember']),
	], is_ssl());
	if (is_wp_error($u)) cs_back('login', 'login');
	wp_safe_redirect(user_can($u, 'edit_posts') ? admin_url() : home_url('/'));
	exit;
});

/* اگر کاربرِ واردشده فرم ورود/ثبت‌نام را بفرستد، به صفحه‌ی اصلی برگردد (به‌جای صفحه‌ی خالی) */
add_action('admin_post_cs_register', 'cs_logged_in_redirect');
add_action('admin_post_cs_login', 'cs_logged_in_redirect');
function cs_logged_in_redirect() {
	wp_safe_redirect(home_url('/'));
	exit;
}

function cs_msg() {
	$m = ['nonce' => 'درخواست نامعتبر بود، دوباره تلاش کنید.', 'fields' => 'نام کاربری (حداقل ۳ حرف) و ایمیل معتبر وارد کنید.',
		'pass' => 'رمز عبور باید حداقل ۸ کاراکتر باشد.', 'user' => 'این نام کاربری قبلا گرفته شده.', 'email' => 'این ایمیل قبلا ثبت شده.',
		'fail' => 'ثبت‌نام انجام نشد، دوباره تلاش کنید.', 'login' => 'نام کاربری یا رمز عبور اشتباه است.'];
	$c = isset($_GET['cs_err']) ? sanitize_key($_GET['cs_err']) : '';
	return isset($m[$c]) ? '<p class="msg" role="alert">' . esc_html($m[$c]) . '</p>' : '';
}

add_shortcode('cs_register', function () {
	if (is_user_logged_in()) return '<p>شما وارد شده‌اید.</p>';
	ob_start(); ?>
	<form class="auth" method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
		<?php echo cs_msg(); ?>
		<input type="hidden" name="action" value="cs_register">
		<?php wp_nonce_field('cs_register', 'cs_n'); ?>
		<label>نام و نام خانوادگی<input name="name" autocomplete="name"></label>
		<label>نام کاربری (انگلیسی)<input name="user" required autocomplete="username" dir="ltr"></label>
		<label>ایمیل<input type="email" name="email" required autocomplete="email" dir="ltr"></label>
		<label>رمز عبور (حداقل ۸ کاراکتر)<input type="password" name="pass" required minlength="8" autocomplete="new-password" dir="ltr"></label>
		<input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
		<button class="btn" type="submit">ثبت‌نام</button>
		<p class="alt">قبلا ثبت‌نام کرده‌اید؟ <a href="<?php echo esc_url(home_url('/login/')); ?>">ورود</a></p>
	</form>
	<?php return ob_get_clean();
});

add_shortcode('cs_login', function () {
	if (is_user_logged_in()) return '<p>شما وارد شده‌اید.</p>';
	ob_start(); ?>
	<form class="auth" method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
		<?php echo cs_msg(); ?>
		<input type="hidden" name="action" value="cs_login">
		<?php wp_nonce_field('cs_login', 'cs_n'); ?>
		<label>نام کاربری یا ایمیل<input name="user" required autocomplete="username" dir="ltr"></label>
		<label>رمز عبور<input type="password" name="pass" required autocomplete="current-password" dir="ltr"></label>
		<label class="check"><input type="checkbox" name="remember" value="1"> مرا به خاطر بسپار</label>
		<button class="btn" type="submit">ورود</button>
		<p class="alt">حساب ندارید؟ <a href="<?php echo esc_url(home_url('/register/')); ?>">ثبت‌نام</a></p>
	</form>
	<?php return ob_get_clean();
});
