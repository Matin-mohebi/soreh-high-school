<!DOCTYPE html>
<html lang="fa-IR" dir="rtl">
<head>
<meta charset="<?php bloginfo('charset'); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script>document.documentElement.classList.add('js');try{if(sessionStorage.getItem('cs_gate'))document.documentElement.classList.add('seen')}catch(e){}</script>
<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<a class="skip" href="#main">رفتن به محتوا</a>
<header class="bar">
	<a class="mark" href="<?php echo esc_url(home_url('/')); ?>"><?php echo esc_html(cs_opt('school_name')); ?></a>
	<nav aria-label="منوی اصلی">
		<a href="<?php echo esc_url(home_url('/#about')); ?>">درباره</a>
		<a href="<?php echo esc_url(home_url('/#staff')); ?>">مدیر و معاونان</a>
		<a href="<?php echo esc_url(home_url('/#students')); ?>">دانش‌آموزان</a>
	</nav>
	<div class="acts">
		<?php if (is_user_logged_in()) : ?>
			<?php if (current_user_can('edit_posts')) : ?><a href="<?php echo esc_url(admin_url()); ?>">پنل مدیریت</a><?php endif; ?>
			<a href="<?php echo esc_url(wp_logout_url(home_url('/'))); ?>">خروج</a>
		<?php else : ?>
			<a href="<?php echo esc_url(home_url('/login/')); ?>">ورود</a>
			<a class="btn btn--sm" href="<?php echo esc_url(home_url('/register/')); ?>">ثبت‌نام</a>
		<?php endif; ?>
	</div>
</header>
