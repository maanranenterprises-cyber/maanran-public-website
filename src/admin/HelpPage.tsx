// Short guide for editors, shown inside the admin.
import type { ReactNode } from 'react'
import { Card } from './ui'

const Topic = ({ title, children }: { title: string; children: ReactNode }) => (
  <Card title={title}>
    <div className="grid gap-2 text-sm leading-relaxed text-ink/85 [&_li]:ml-5 [&_li]:list-disc [&_strong]:font-semibold">{children}</div>
  </Card>
)

export default function HelpPage() {
  return (
    <div className="grid grid-cols-1 gap-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Help</h1>
        <p className="mt-1 text-sm text-muted">How to update the website. It takes about 5 minutes to read.</p>
      </div>

      <Topic title="1. Save, then Publish">
        <p>
          Nothing you do in the admin changes the website straight away. <strong>Save</strong> keeps your change in drafts. When you are ready, press <strong>Publish</strong> (top right) and
          everything saved goes live together. The website updates in about 2 minutes, and the top bar shows <strong>Publishing…</strong> until it does.
        </p>
        <p>
          Changed your mind before publishing? On the <strong>Dashboard</strong>, <strong>Discard</strong> throws away all unpublished changes. The live website is not affected.
        </p>
      </Topic>

      <Topic title="2. New enquiries">
        <p>
          Every enquiry from the website appears under <strong>Enquiries</strong> (top of the menu), including people who pressed <strong>Send on WhatsApp</strong>. The menu,
          the dashboard and the browser tab show how many are new; the admin checks every minute.
        </p>
        <ul>
          <li>Use the <strong>Call</strong>, <strong>WhatsApp</strong> and <strong>Email</strong> buttons to reply, then set the status: Contacted, Quoted, Closed or Spam.</li>
          <li>Add <strong>private notes</strong> (e.g. "site visit on Monday"). Only admins see enquiries; they are never on the website.</li>
          <li><strong>Export CSV</strong> downloads the list for Excel or Google Sheets.</li>
        </ul>
      </Topic>

      <Topic title="3. Adding and editing">
        <ul>
          <li>Open a section in the menu (for example Products), then press <strong>Add product</strong>, or click an item to edit it.</li>
          <li>
            Fields marked with a red <strong>*</strong> are required. If something is missing, Save shows what to fix next to the field.
          </li>
          <li>
            On the Products list, choose a category in the dropdown to see only those products. <strong>Add product</strong> then starts in that category.
          </li>
          <li>
            The <strong>arrows</strong> (or dragging) change the order things appear on the website. <strong>Visible / Hidden</strong> shows or hides an item without deleting it.
          </li>
          <li>
            A product's or category's <strong>link name</strong> (its web address) is set from its name and cannot be changed later, so links shared with customers keep working. To rename,
            just change the name.
          </li>
          <li>A category that still has products cannot be deleted. Move or delete those products first.</li>
          <li>
            Every new product gets a <strong>product code</strong> automatically when you save it: the category's prefix and the next number, e.g. <strong>OC-004</strong>. Codes never
            change and a deleted product's number is never reused. A product's category is fixed once it is saved; to move it, add it again in the other category.
          </li>
        </ul>
      </Topic>

      <Topic title="4. Photos and files">
        <ul>
          <li>Drop a photo onto the upload box or click it to choose one. Large phone photos are made smaller automatically.</li>
          <li>For galleries (products, interiors), the first photo is the main one. Use the arrows on a photo to change the order.</li>
          <li>Banners look best with wide photos (1920 × 1080 or larger). Client logos look best on a white or transparent background.</li>
          <li>Downloads take PDF files up to 25 MB. The file type and size are filled in for you.</li>
        </ul>
      </Topic>

      <Topic title="5. Pages and settings">
        <ul>
          <li>
            <strong>Site settings</strong> holds the phone number, WhatsApp, email, opening hours, address, social links and menu. Changes appear across the whole website.
          </li>
          <li>
            <strong>Page text</strong> holds the headings on the home page, page headers, the footer and the privacy and terms pages.
          </li>
          <li>
            Each of these pages has one <strong>Save</strong> button at the bottom. <strong>Undo changes</strong> puts the page back as it was when you opened it.
          </li>
        </ul>
      </Topic>

      <Topic title="6. Customer feedback">
        <p>
          Customers can send feedback at <strong>maanran.com/feedback</strong> (also linked under the testimonials and in the footer). Share that link after a delivery. Each one arrives
          as a hidden testimonial; the menu shows a <strong>new</strong> badge and you also get an email with their contact details.
        </p>
        <ul>
          <li>
            Open <strong>Testimonials → Awaiting review</strong>, read it, tidy spelling if needed (keep their meaning), add a photo if you have one, then press <strong>Approve</strong>. It
            appears on the website after you <strong>Publish</strong>.
          </li>
          <li>Spam or unsuitable feedback: just delete it.</li>
        </ul>
      </Topic>

      <Topic title="7. Undoing a publish">
        <p>
          <strong>History</strong> lists every publish. The most recent one has <strong>Undo this publish</strong>, which puts the website back as it was before it. Publish or discard any
          unpublished changes first.
        </p>
      </Topic>

      <Topic title="8. If something goes wrong">
        <ul>
          <li>
            <strong>"Someone else changed this"</strong>: another editor saved the same section. Reload the page and make your change again.
          </li>
          <li>
            <strong>"Cannot publish yet"</strong>: something saved is incomplete. The message lists what to fix.
          </li>
          <li>
            <strong>"The website hasn't updated"</strong> in the top bar: the update is taking far longer than usual. Contact your developer.
          </li>
          <li>
            <strong>"Please log in again"</strong>: you were logged out (logins last 1 day, or the password changed). Log in and carry on; saved changes are not lost.
          </li>
        </ul>
      </Topic>
    </div>
  )
}
