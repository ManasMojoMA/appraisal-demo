import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function initStorage() {
  console.log("Checking storage buckets...");
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  
  if (listError) {
    console.error("Error listing buckets:", listError.message);
    process.exit(1);
  }

  const bucketExists = buckets.some(b => b.name === 'evidence');
  
  if (!bucketExists) {
    console.log("Creating 'evidence' bucket...");
    const { data, error } = await supabase.storage.createBucket('evidence', {
      public: false,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
      fileSizeLimit: 5242880 // 5MB
    });

    if (error) {
      console.error("Error creating bucket:", error.message);
    } else {
      console.log("Bucket 'evidence' created successfully!");
    }
  } else {
    console.log("Bucket 'evidence' already exists.");
  }
}

initStorage();
