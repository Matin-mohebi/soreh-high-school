<?php
get_header();
$staff    = cs_items('staff');
$students = cs_items('student');
$hero_img = cs_opt('hero_image');
?>

<div class="gate" id="gate" role="dialog" aria-label="ورود به سایت">
	<a class="gate__half gate__half--staff" href="#staff" data-go="staff">
		<strong><?php echo esc_html(cs_opt('staff_title')); ?></strong>
		<span><?php echo esc_html(cs_opt('gate_staff_text')); ?></span>
	</a>
	<a class="gate__half gate__half--students" href="#students" data-go="students">
		<strong><?php echo esc_html(cs_opt('students_title')); ?></strong>
		<span><?php echo esc_html(cs_opt('gate_students_text')); ?></span>
	</a>
	<button class="gate__skip" type="button" data-skip>ورود به صفحه اصلی</button>
</div>

<main id="main">

<section class="hero<?php echo $hero_img ? ' hero--img' : ''; ?>">
	<div class="hero__text">
		<h1 data-reveal><?php echo esc_html(cs_opt('school_name')); ?></h1>
		<p data-reveal><?php echo cs_text('hero_text'); ?></p>
		<p class="hero__acts" data-reveal>
			<a class="btn" href="#students">برترین‌ها را ببینید</a>
			<a class="link" href="#staff">آشنایی با مدیریت</a>
			<?php cs_edit_link(cs_customize_url('cs_hero')); ?>
		</p>
	</div>
	<?php if ($hero_img) : ?>
		<div class="hero__img"><img src="<?php echo esc_url($hero_img); ?>" alt=""></div>
	<?php endif; ?>
</section>

<section class="about" id="about">
	<div class="about__text">
		<h2 data-reveal><?php echo esc_html(cs_opt('about_title')); ?></h2>
		<p data-reveal><?php echo cs_text('about_text'); ?></p>
		<?php cs_edit_link(cs_customize_url('cs_about')); ?>
	</div>
	<ul class="stats">
		<?php for ($i = 1; $i <= 3; $i++) : ?>
			<li data-reveal>
				<b data-count="<?php echo esc_attr(preg_replace('/\D/', '', cs_opt("stat{$i}_n"))); ?>"><?php echo esc_html(cs_opt("stat{$i}_n")); ?></b>
				<span><?php echo esc_html(cs_opt("stat{$i}_l")); ?></span>
			</li>
		<?php endfor; ?>
	</ul>
</section>

<section class="staff" id="staff">
	<div class="head">
		<h2 data-reveal><?php echo esc_html(cs_opt('staff_title')); ?></h2>
		<p data-reveal><?php echo cs_text('staff_text'); ?></p>
		<?php cs_edit_link(admin_url('post-new.php?post_type=staff'), 'افزودن عضو'); ?>
		<?php cs_edit_link(cs_customize_url('cs_staff'), 'ویرایش متن بخش'); ?>
	</div>
	<div class="grid grid--staff">
		<?php foreach ($staff as $p) :
			$bio = has_excerpt($p) ? get_the_excerpt($p) : wp_strip_all_tags($p->post_content); ?>
			<article class="person" data-reveal>
				<div class="ph ph--portrait">
					<?php if (has_post_thumbnail($p)) echo get_the_post_thumbnail($p, 'cs-portrait', ['loading' => 'lazy']); ?>
				</div>
				<h3><?php echo esc_html(get_the_title($p)); ?></h3>
				<p class="role"><?php echo esc_html(get_post_meta($p->ID, 'cs_role', true)); ?></p>
				<p><?php echo esc_html(wp_trim_words($bio, 28)); ?></p>
				<?php cs_edit_link(get_edit_post_link($p->ID)); ?>
			</article>
		<?php endforeach; ?>
		<?php for ($i = count($staff); $i < 4; $i++) : ?>
			<article class="person person--empty" data-reveal>
				<div class="ph ph--portrait"></div>
				<h3>نام مدیر یا معاون</h3>
				<p class="role">سمت</p>
				<p>توضیح کوتاه درباره این فرد اینجا نمایش داده می‌شود.</p>
				<?php cs_edit_link(admin_url('post-new.php?post_type=staff'), 'پر کردن این جای خالی'); ?>
			</article>
		<?php endfor; ?>
	</div>
</section>

<section class="students" id="students">
	<div class="head">
		<h2 data-reveal><?php echo esc_html(cs_opt('students_title')); ?></h2>
		<p data-reveal><?php echo cs_text('students_text'); ?></p>
		<?php cs_edit_link(admin_url('post-new.php?post_type=student'), 'افزودن دانش‌آموز'); ?>
		<?php cs_edit_link(cs_customize_url('cs_students'), 'ویرایش متن بخش'); ?>
	</div>
	<div class="grid grid--students">
		<?php foreach ($students as $p) : ?>
			<article class="kid" data-reveal>
				<div class="ph ph--square">
					<?php if (has_post_thumbnail($p)) echo get_the_post_thumbnail($p, 'cs-square', ['loading' => 'lazy']); ?>
				</div>
				<?php $rank = get_post_meta($p->ID, 'cs_rank', true); if ($rank) : ?><b class="rank"><?php echo esc_html($rank); ?></b><?php endif; ?>
				<h3><?php echo esc_html(get_the_title($p)); ?></h3>
				<p class="role"><?php echo esc_html(get_post_meta($p->ID, 'cs_grade', true)); ?></p>
				<p><?php echo esc_html(get_post_meta($p->ID, 'cs_note', true)); ?></p>
				<?php cs_edit_link(get_edit_post_link($p->ID)); ?>
			</article>
		<?php endforeach; ?>
		<?php for ($i = count($students); $i < 8; $i++) : ?>
			<article class="kid kid--empty" data-reveal>
				<div class="ph ph--square"></div>
				<b class="rank">؟</b>
				<h3>نام دانش‌آموز</h3>
				<p class="role">پایه</p>
				<?php cs_edit_link(admin_url('post-new.php?post_type=student'), 'پر کردن این جای خالی'); ?>
			</article>
		<?php endfor; ?>
	</div>
</section>

<?php if (!is_user_logged_in()) : ?>
<section class="join" id="join">
	<h2 data-reveal>عضو خانواده مدرسه شوید</h2>
	<p data-reveal>با ساخت حساب، از اخبار و اطلاعیه‌های مدرسه باخبر بمانید.</p>
	<p class="hero__acts" data-reveal>
		<a class="btn" href="<?php echo esc_url(home_url('/register/')); ?>">ثبت‌نام</a>
		<a class="link" href="<?php echo esc_url(home_url('/login/')); ?>">ورود</a>
	</p>
</section>
<?php endif; ?>

</main>
<?php get_footer(); ?>
