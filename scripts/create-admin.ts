/**
 * Utility script to create an admin account
 * Run with: npx tsx scripts/create-admin.ts
 */

import { createAdminClient } from '../lib/supabase/admin'
import { hashPassword } from '../lib/auth'
import { randomUUID } from 'crypto'

async function createAdmin() {
  const supabase = createAdminClient()
  
  // Get admin details from command line or use defaults
  const username = process.argv[2] || 'admin'
  const email = process.argv[3] || 'admin@vega.com'
  const password = process.argv[4] || 'admin123'
  const firstName = process.argv[5] || 'Admin'
  const lastName = process.argv[6] || 'User'

  console.log('Creating admin account...')
  console.log(`Username: ${username}`)
  console.log(`Email: ${email}`)
  console.log(`Password: ${password}`)
  console.log(`Name: ${firstName} ${lastName}`)
  console.log('')

  // Hash the password
  const passwordHash = await hashPassword(password)

  // Create admin record
  const adminId = randomUUID()
  const { data, error } = await supabase
    .from('admins')
    .insert({
      id: adminId,
      username,
      email,
      password_hash: passwordHash,
      first_name: firstName,
      last_name: lastName,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating admin:', error)
    if (error.code === '23505') {
      console.error('Admin with this username or email already exists!')
    }
    process.exit(1)
  }

  console.log('✅ Admin account created successfully!')
  console.log('')
  console.log('You can now login with:')
  console.log(`  Username: ${username}`)
  console.log(`  Email: ${email}`)
  console.log(`  Password: ${password}`)
  console.log('')
  console.log('Make sure to select "Login as Admin" on the login page.')
}

createAdmin().catch(console.error)

