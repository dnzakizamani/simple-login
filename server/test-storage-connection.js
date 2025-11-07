const { supabase } = require('./supabase');

async function testSupabaseStorage() {
  console.log('Testing Supabase Storage connection...');
  
  if (!supabase) {
    console.error('❌ Supabase client not initialized. Please check your environment variables.');
    console.log('Make sure SUPABASE_URL and SUPABASE_ANON_KEY are set in your .env file.');
    return;
  }

  try {
    // Test connection by listing buckets
    console.log('Fetching buckets list...');
    const { data, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('❌ Error fetching buckets:', error.message);
      return;
    }
    
    console.log('✅ Successfully connected to Supabase Storage!');
    console.log('Available buckets:', data);
    
    // Test upload to pdf-files bucket (create a simple test file)
    console.log('\nTesting upload to pdf-files bucket...');
    const testContent = 'This is a test file to verify Supabase Storage connection';
    const fileName = `test-${Date.now()}.txt`;
    
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('pdf-files') // Using the same bucket as in our PDF routes
      .upload(fileName, testContent, {
        contentType: 'text/plain'
      });

    if (uploadError) {
      console.error('❌ Error uploading test file:', uploadError.message);
      console.log('This might mean the bucket "pdf-files" does not exist.');
      console.log('Please create the bucket in your Supabase dashboard.');
      return;
    }
    
    console.log('✅ Test file uploaded successfully:', fileName);
    
    // Test download
    console.log('\nTesting download...');
    const { data: downloadData, error: downloadError } = await supabase
      .storage
      .from('pdf-files')
      .download(fileName);

    if (downloadError) {
      console.error('❌ Error downloading test file:', downloadError.message);
      return;
    }
    
    console.log('✅ Test file downloaded successfully');
    
    // Test delete
    console.log('\nTesting delete...');
    const { error: deleteError } = await supabase
      .storage
      .from('pdf-files')
      .remove([fileName]);

    if (deleteError) {
      console.error('❌ Error deleting test file:', deleteError.message);
      return;
    }
    
    console.log('✅ Test file deleted successfully');
    console.log('\n🎉 All tests passed! Supabase Storage is working correctly.');
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  }
}

// Run the test
testSupabaseStorage();