<footer class="foot">
	<p class="foot__name"><?php echo esc_html(cs_opt('school_name')); ?></p>
	<div class="foot__row">
		<span><?php echo esc_html(cs_opt('note')); ?></span>
		<?php if (cs_opt('address')) : ?><span><?php echo esc_html(cs_opt('address')); ?></span><?php endif; ?>
		<?php if (cs_opt('phone')) : ?><span dir="ltr"><?php echo esc_html(cs_opt('phone')); ?></span><?php endif; ?>
		<?php cs_edit_link(cs_customize_url('cs_footer'), 'ویرایش'); ?>
	</div>
</footer>
<?php wp_footer(); ?>
</body>
</html>
