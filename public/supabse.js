// Isme URL aur Key sirf EK baar aayegi
const supabaseUrl = "https://dfqqdiervjdwopjtyqmu.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmcXFkaWVydmpkd29wanR5cW11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5MjU4OTUsImV4cCI6MjA4NzUwMTg5NX0.pN-e2l-yDyFUGWJxyYn6w7VlKBPr6UVGeE9O-DLyy4M";
     

// Initialize the client
const _supabase = supabase.createClient(supabaseUrl, supabaseKey);

// Isko global window object mein daal dein taaki har page access kar sake
window.client = _supabase; 