import Image from "next/image";

export default function TestimonialCard({ testimonial }) {
    return (
        <div className="testimonial-card ">
            <div className="test-quote">
                <Image src="/images/quote-black.png" alt="Quote" width={46} height={42} />
            </div>

            <span>{testimonial.heading}</span>

            <p>{testimonial.description}</p>

            <div className="author-area">
                <div className="author-img">
                    <Image
                        src={testimonial.image}
                        alt={testimonial.name}
                        width={70}
                        height={70}
                    />
                </div>

                <div className="author-content">
                    <h5>{testimonial.name}</h5>
                    <span>{testimonial.designation}</span>
                </div>
            </div>
        </div>
    );
}