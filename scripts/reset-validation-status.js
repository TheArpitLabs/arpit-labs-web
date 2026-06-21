require('dotenv').config({
  path: '.env.local'
});

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function resetValidationStatus() {
  console.log('🔄 Resetting validation status for all projects...\n');

  // Reset validation status for projects with GitHub URLs
  const { error } = await supabase
    .from('projects')
    .update({
      validation_status: 'pending',
      validation_score: 0,
      validation_errors: [],
      validated_at: null,
    })
    .not('github_url', 'is', null);

  if (error) {
    console.error('❌ Error resetting validation status:', error);
  } else {
    console.log('✅ Validation status reset successfully');
  }
}

resetValidationStatus().catch(console.error);
