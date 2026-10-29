<?php get_header(); ?>
<main id="main" class="page">
	<?php if (have_posts()) : while (have_posts()) : the_post(); ?>
		<article class="page__in">
			<h1><?php the_title(); ?></h1>
			<div class="prose"><?php the_content(); ?></div>
		</article>
	<?php endwhile; endif; ?>
</main>
<?php get_footer(); ?>
