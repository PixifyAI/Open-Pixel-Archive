import React from 'react';

const AboutPage = () => {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-4xl font-bold text-center mb-8">About Open Pixel Archive</h1>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Open Pixel Archive is a free and open-source digital archive designed to store and manage a wide variety of file types. Our goal is to provide a reliable and accessible platform for preserving and sharing digital content for everyone.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Key Features</h2>
        <ul className="list-disc list-inside text-lg text-muted-foreground leading-relaxed space-y-2">
          <li><strong>Persistent Links:</strong> Share files with confidence, knowing that links to your content will remain stable over time.</li>
          <li><strong>Integrated Playback & Gallery:</strong> Directly view, play, and browse supported media files (images, videos, audio) within a visually appealing gallery format.</li>
          <li><strong>Diverse File Type Support:</strong> Archive virtually anything, from documents and images to applications and programs, without worrying about broken links.</li>
          <li><strong>AI Image Integration:</strong> Seamlessly explore and manage your AI-generated images alongside your other digital assets.</li>
          <li><strong>Free and Open Source:</strong> Open Pixel Archive is built on open principles, free to use, and welcoming to community contributions.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Join Us</h2>
        <p className="text-lg text-muted-foreground leading-relaxed">
          We are continuously improving Open Pixel Archive with the help of our community. Join us in building a comprehensive and accessible digital archive for the future.
        </p>
      </section>
    </div>
  );
};

export default AboutPage;
