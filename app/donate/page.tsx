import React from 'react';

const DonatePage = () => {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-4xl font-bold text-center mb-8">Support Open Pixel Archive</h1>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Why Your Support Matters</h2>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Open Pixel Archive is a free and open-source project dedicated to providing a permanent and accessible archive for all types of digital media. To keep this resource available and growing for everyone, we rely on the support of our community.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Where Your Donation Goes</h2>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Your generous contributions directly help us cover the ever-increasing costs of server storage, which is crucial for housing the vast amount of data in the archive. Additionally, a portion of the funds will go towards supporting other valuable open-source initiatives that align with our mission, such as <a href="https://pixifyai.art" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">pixifyai.art</a>.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">How to Donate</h2>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Every contribution, no matter the size, makes a significant impact. We are currently setting up the best ways to accept donations. Please check back soon for more information on how you can support Open Pixel Archive.
        </p>
        {/* Placeholder for donation options */}
        {/* <div className="mt-6">
          <Button size="lg">Donate Now</Button>
        </div> */}
      </section>
    </div>
  );
};

export default DonatePage;
