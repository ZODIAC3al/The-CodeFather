import Navbar from '@/components/Navbar';

export default function Loading() {
  return (
    <div className="flex flex-col min-h-screen bg-base-200">
      <Navbar />
      <div className="flex justify-center items-center flex-grow">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    </div>
  );
}